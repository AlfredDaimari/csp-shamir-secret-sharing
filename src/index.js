const server = require('./socket')




server.listen(9696, () => console.log(`server is up and running in port 9696 -- ${Date()}`))