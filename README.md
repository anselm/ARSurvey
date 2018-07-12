# ARSurvey

This is a collection of use cases for AR based on interviews and then some analysis of those use cases.

A live link should be at https://anselm.github.io/ARSurvey/?path=AR%20Use%20Case%20Survey

# Engine Comments

The engine itself is a riff on an existing project which I wrote a few years ago - you can see more at http://lifecards.org/#about

Here are some more comments on what I'm trying to do in more detail. Although there's not much code here it has been quite a bit of thought:

We are surrounded by a sea of digital artifacts that we care about. Yet to organize and manage those artifacts is difficult. There are many tools, many views, many ways of storing, representing and sharing data. It is especially difficult to do so between many people. We each have different ideas about what constitutes an object, how they are organized - but beyond that we also simply don't have the tools to represent ideas as objects or even organize them at all. The engine this tool is written in is itself an exploration of how to organize and encapsulate information for sharing between multiple participants.

The web has traditionally been a document centric viewing tool - with a single page being a single document - and often representing the point of view of a single source or author. In this model there are multiple separate pages, and a consumer tends to view one page at a time and then switch between pages.

The emerging web will more likely invert this pattern. Instead there will be many mutiple objects from different authors in a single view and these objects will compete for the users attention in some way. The objects will have relationships to one another in varying degrees. Some objects may be similar 'kinds' as other objects - while some objects may be 'children of' other objects.

In this tool a digital artifact is represented as a single card. A card can have a title, link, description, depiction, tags, sponsors, a location, a time period and other attributes. Cards have rich relationships to each other and this can help with navigating between cards, grouping cards, finding related topics and organization across multiple dimensions. Each card has a 'kind' attribute as well which connects that card to one or more pieces of code which can handle any behaviors associated with that card. The main role of having a 'kind' attribute is similar to that of a mime-type - it specifies how that card would prefer to be painted when seen by the user. A card can paint itself and it's children or anything that it wishes. However cards don't always get full control of how they are represented - it's often the case that the user wishes to see information presented in a specific way - such as on a globe, or on a calendar or in a simple list.

