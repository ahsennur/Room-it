//users list to track user information
const users = []

const addUser = ({ id, username, room }) => {
    // trims and makes lowercase to prevent the same
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // checks if username and room info exists to add
    if (!username || !room) {
        return {
            error: 'Please enter both username and room '
        }
    }

    //checks if the username already exists
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    if (existingUser) {
        return {
            error: 'Username already exists, please try a different one'
        }
    }

    // pushes the user to users list
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {

    //finds the index of the user in the list or is undefined if no such user
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        //returns the deleted user
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    //returns the user with that socket id
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {

    //returns the list of users in a room
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}