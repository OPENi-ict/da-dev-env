# Setting up the environment
Clone this repo and then from that directory run `vagrant up`, this will take a while, go get a coffee.

 Once vagrant is finsihed it will have

* Configured Couchbase & Elasticsearch
* Created a Couchbase bucket, and Elasticsearch index, both named *openi*
* Configured replciation from Couchbase to Elasticsearch

Once the vagrant box is running `vagrant ssh` to access it. Then `cd` to `/vagrant/searchApp` and run `npm install`.
Once npm is finished installing the required packages, running `node app.js` will start up the express server.

# Configuring Couchbase
The Couchbase admin console can be accessed via your browser at `192.168.33.10:8091` with a username of `admin` and password of `password`

# Searching Cloudlets
If you are running these queries from within the vagrant box you can use *localhost*, but if you are querying from your local machine replace *localhost* with *192.168.33.10*

The response is in the form of a JSON object containing the cloudlet IDs that satisfy the search parameters, e.g.
`{"ids":["4","1","2"]}`

### via objects
`curl -XGET 'http://192.168.33.10:8080/search/ids?objects=age,name'`

### via attributes
`curl -XGET 'http://192.168.33.10:8080/search/ids?name=Philip&age=30'`

### within a range
The range below is equivalent to saying the age is *from 20 to 30*
`curl -XGET 'http://192.168.33.10:8080/search/ids?name=Philip&age=20:30'`

### via objects and attributes
`curl -XGET 'http://192.168.33.10:8080/search/ids?objects=name&age=20:50'`