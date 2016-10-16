Data Access Object (DAO)
===
So this is an attempt to allow different backends to be implemented.   Currently there is only the "Cassandra" DAO, but
other providers such as In Memory, Postgres,...etc, are possible.   Basically implement all public functions (public
functions don't start with _)
in cassandra/dao.js and you will be well on your way.

Basically trying to expose the most minimal API needed to implement, to prevent leakage to the other services.

