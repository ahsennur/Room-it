const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()

const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '/public')

const port = process.env.PORT || 4000
const msg = "WELCOME"

//could not serve the public then it just suddenly did!!?
app.use(express.static(publicDirectoryPath))

// app.get('/', (req, res) => {
//     res.render('index')
// })

//when it starts all the code in the io.on runs
io.on('connection', (socket) => {
    console.log("connected")
    socket.emit('welcome', msg)

    console.log('New WebSocket connection')

    // to be able to seperate rooms, adds that socket to that spesific room
    //so that messsages can be only sent to and read from that room with "".to(room)""
    //options include username and room info
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Room it!', 'Welcome!'))
        
        //broadcast notifies all the users in that room but the current user
        socket.broadcast.to(user.room).emit('message', generateMessage('Room it!', `${user.username} has joined!`))
        
        //emits updated roomData for sidebar
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    //on sendmesssage event, a callback function is set on the client side
    //that callback takes an error message as its parameter, then prints it
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        //so in this case the error message is sent with parameter if profane
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))

        //so if there is no error, this callback from the client has no error parameter
        callback()
    })

    //on the event, a callback function is set on the client side
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    //when user gets disconnected
    socket.on('disconnect', () => {

        //finds and removes user from the list
        const user = removeUser(socket.id)

        //only notifies if there was such user in that room
        if (user) {

            //only notifies the users in that room uding .to(user.room)
            io.to(user.room).emit('message', generateMessage('Room it!', `${user.username} has left!`))
           
           //emits roomData for sidebar
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up, port: ${port}!`)
})