# Google Docs clone and a custom load balancer which routes requests to multiple backend instances based on document url. 
# Features:
- Real time collaboration and rich presence using Operation Transform
- Authentication via email
- Sticky sessions
- Autocomplete
- Search (among all documents)

## Frontend technologies used:
- React
- Sharedb (collaborative UI)
- quilljs (text editing)
- rich-text (supports bold, underline, italics, etc)

## Backend technologies used:
- Elasticsearch (autocomplete/search)
- mongodb (database)
- mongoose (odm)
- express (server)
- nodemailer (mail authentication)
- multer (image upload)


This was deployed on multiple cloud instances, loadbalanced application side.
