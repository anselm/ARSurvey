
class Log {
  static log(str) {
    console.log(str);
  }
  static error(str) {
    console.error(str);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// System DB 
/////////////////////////////////////////////////////////////////////////////////////////////////////

let db = {};
let tags = {};

class DB {

  static query(q) {
    // bad input? return an empty set
    if(!q || !q.length) {
      Log.error("bad query");
      return [];
    }
    // '?' is used to indicate a query rather than a literal such as '?tags:blue' or '?sponsor:joe'
    if(q[0] == '?') {
      let remainder = q.substring(1).toLowerCase();
      let tokens = remainder.split('=');
      if(tokens[0] == "tags") {
        let tag = tokens[1];
        return tags[tag] ? tags[tag] : [];
      }
      // HACK
      if(tokens[0] == "sponsor") {
        let results = [];
        Object.keys(db).forEach((key) => {
          let item = db[key];
          if(item.sponsor && item.sponsor.toLowerCase() == tokens[1]) {
            console.log("found " + item.title);
            results.push(item);
          }
        });
        return results;
      }
      return [];
    }
    // else is a literal query for one entity - always return a set
    let results = db[q.toLowerCase()];
    if(!results) return [];
    return [ results ];
  }

  static insert_tags(node) {
    if(!node.tags || !node.tags.length) return;
    let ts = node.tags.split(",");
    for(let i = 0;i<ts.length;i++) {
      let t = ts[i] = ts[i].toLowerCase().trim();
      let set = tags[t];
      if(!set) { set = tags[t] = []; }
      set.push(node);
    }
  }

  static insert_one(node) {
    // store node by globally unique identifier
    let key = node.title;
    Log.log("Adding " + key );
    if(!key || !key.length) {
      Log.error("Bad data");
      return;
    }
    if(!(typeof key === 'string' || key instanceof String)) {
      Log.error("bad data"); 
      return;
    }
    key = key.toLowerCase();
    if(db[key]) {
      Log.error("duplicate key inserted " + key);
      return;
    }
    db[key] = node;
    // process tags
    DB.insert_tags(node);
    // children may have been delivered insitu - move to separate table entries and cite by guid
    for(let i = 0; node.children && i < node.children.length; i++) {
      let child = node.children[i];
      if((typeof child === 'string' || child instanceof String)) continue;
      DB.insert_one(child);
      node.children[i] = child.title;
    }
  }

  static insert(blob) {
    if (Array.isArray(blob)) {
      blob.forEach((node) => { DB.insert_one(node); });
    } else {
      let node = blob;
      DB.insert_one(node);
    }
  }

  static children(node,handler) {
    if(!node || !node.children) return;
    node.children.forEach((q) => {
      DB.query(q).forEach( handler );
    });
  }

  static load(urls,finished) {
    Promise.all(urls.map(url => fetch(url).then(json => json.json()))).then(blobs => {
      Log.log("loaded blobs");
      blobs.forEach( DB.insert );
      finished();
    });
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// System Painter - there's no VDOM or stuff like that because this would ultimately be threejs based
/////////////////////////////////////////////////////////////////////////////////////////////////////

let buffer = "";

class Paint {
  static raw(str) {
    buffer += str + "\n";
  }
  static div(contents,_class="",style="") {
    buffer += "<div class='"+_class+"' style='"+style+"'>"+contents+"</div>";
  }
  static h1(contents,_class="",style="") {
    buffer += "<h1 class='"+_class+"' style='"+style+"'>"+contents+"</h1>";
  }
  static finish() {
    document.getElementById("root").innerHTML = buffer;
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// User land behaviors
//
// Most emphasis will be on user land logic - for producing views and behaviors - using an ECS system - no VDOM or templates yet
// Ultimately the goal would be to render into 3d
//
/////////////////////////////////////////////////////////////////////////////////////////////////////

class Card {
  static paint_item(node) {

    // build a link to the sponsor
    let buffer = "";
    let sponsors = node.sponsor ? DB.query(node.sponsor) : 0;
    if(sponsors) sponsors.forEach((sponsor) => {
      buffer += '<a style="position:absolute;bottom:2;right:2;width:32px;height:32px" href="?path='+sponsor.title+'"><img style="opacity:0.5;height:32px;width:32px;border-radius:30px;" src="'+sponsor.art+'" alt="'+sponsor.title+'"></a>';
    });

    // build the card
    let card_style = "float:left; overflow: hidden; position: relative; width: 200px; height: 130px; margin: 6px; padding: 0px; background: #f8f8ff; border-radius: 1px;" + node.style;
console.log(card_style);
    let card_art_style = "z-index:0;opacity:0.2; position: absolute; top:63; width: 100%; height: 100%; background: no-repeat center center fixed center-fixed; background-size: cover; " + "background-image:url('"+node.art+"')";
    let str =
      '<div style="'+card_style+'">' +
        '<div style="'+card_art_style+'"></div>'+
        '<div style="padding:2px"><a style="font-size:1.50rem;" href="?path='+node.title+'">'+node.title+'</a></div>' +
        '<div style="padding:2px;position:absolute;top:64px">'+node.tags+'</div>' +
        buffer +
      '</div>';

    // Paint it now
    Paint.raw(str);
  }
  static paint_children(node) {
    if(!node.children) {
      Card.paint_item(node);
      return;
    }
    Paint.raw('<div style="clear:both;background:#ccccff">');
    Paint.h1('<a href="?path='+node.title+'">'+node.title+'</a>');
    Paint.raw('<div>'+node.descr+'</div><br/>');
    node.children.forEach((q)=>{
      DB.query(q).forEach( Card.paint_children );
    });
    Paint.raw('</div>');
  }
  static paint(node) {
    Paint.raw('<div style="clear:both">');
    Paint.h1(node.title);
    Paint.raw('<div>'+node.descr+'</div><br/>');
    if(!node.children)return;
    node.children.forEach((q)=>{
      DB.query(q).forEach( Card.paint_children );
    });
  }
}

// - while a node has children just paint it and then recurse else paint card
// - i could paint children hierarchically


class Sponsor {
  static paint(node) {
    Paint.h1(node.title);
    DB.children(node,(node) => {
      Card.paint_item(node);
    });
  }
}

class Prose {
  static paint(node) {
    Paint.h1(node.title);
    DB.children(node,(node) => {
      let str =
        '<div>' +
          '<h2>'+node.title+'</h2>' + 
          '<div>'+node.descr+'</div>' +
        '</div>';
      Paint.raw(str);
    });
  }
}

class Toc {
  static paint(node) {
    Paint.h1(node.title);
    DB.children(node,(node) => {
      Paint.raw('<i style="color:blue;font-size:24px" class="fa">&#xf101;</i>&nbsp;<a style="font-size:1.50rem" href="?path='+node.title+'">'+node.title+'</a><br/>');
    });
  }
}

class Kind {
  static paint(node) {
    let kind = node.kind ? node.kind.charAt(0).toUpperCase() + node.kind.slice(1) : 0;
    let handler = kind ? eval(kind+".paint") : Card.paint;
    handler(node);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Boot stuff up
/////////////////////////////////////////////////////////////////////////////////////////////////////

function bootstrap(files) {
  DB.load(files,() => {

    Log.log("Doing layout");

    // Look at the URL and pluck out the document to focus on
    let parts = document.location.search.substring(1).split("&");
    let path = unescape(parts[0].split("=")[1]);

    // Find that document
    let nodes = DB.query(path);
    if(!nodes) {
      return;
    }

    // Paint by kind
    nodes.forEach( Kind.paint );

    // Finalize 
    Paint.finish();

  });
}

