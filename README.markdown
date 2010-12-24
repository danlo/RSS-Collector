Redis Study - RSS Collector
=============================

The goal of this project is to store stats and other informational messages in a 
Redis (loss-able data) which can be later provided as an RSS feed.

This would provide a simpler "loss-able" way of communication among the team and 
provide the system with a way to talk to developers... sort of via commonly read RSS
feeds.  You could read this on your cell phone!

The following methods of communication are to be accepted

        * Via Redis directly: pub-sub
        * Via HTTP POST/GET
        * More?


Usage:
------

The ideal situation for this software is that you have a complicated internal network
with firewalls, proxies, and lots of other stuff.  This code is to allow your software
to post messages to an external service (RSS Collector) and then view them via your
browser (cell phone, feed reader, etc..).

Internal Structure:
-------------------

RSS Collector, is a basic publish subscribe model.  All received messages are published 
into a Redis pub-sub channel.  RSS Collector also has a subscriber that will accept 
published messages and put them in a redis list.

Invocation:

node index.js historian

    Starts up the web RSS serivce on http://127.0.0.1:8124/
    
    Listens on a redis channel for new messages (see config.json)

node index.js say "Woot woot"

    Posts a message to the redis channel for consumption by any process including 
    the above historian process.

Data Structures:
----------------

The config.json holds the configuration information for Redis and the channels to use.

The history_key is an array of "history_max_count" items.

See lib/message.js for message structure

System Requirements:
--------------------

      node.js     @2.5    http://www.nodejs.org
      redis       @2.0    http://redis.io/
      nodeunit            - testing framework

