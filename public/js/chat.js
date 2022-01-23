const socket = io()

// $ prefix for names is a convention for varibles from DOM
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    //total height of the message with the text and margin
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // height of the scroll bar 
    const visibleHeight = $messages.offsetHeight

    //total height of all the container
    const containerHeight = $messages.scrollHeight

    //scrollTop gives the distance between the top and scroll bar top
    const scrollOffset = $messages.scrollTop + visibleHeight

    //scrolls to the bottom automatically if is already at the bottom
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// socket.on('welcome', (msg) => {
//     console.log(msg)
// })
socket.on('message', (message) => {
    console.log(message)

    //messageTemplate is an innerhtml of the script message template in the chat.html
    const html = Mustache.render(messageTemplate, {

        //sets the value of the varibles of message template in the html
        username: message.username,
        message: message.text,

        //formats time
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    //beforeend adds newer under others
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)

    //here the varible messageTemplate is an innerhtml of the script message template in the chat.html
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        
        //formats time
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    //beforeend adds newer under others
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {

    //sets sidebar varibles with updated info
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {

    //prevents enter to submit
    e.preventDefault()

    //disables button (enabled in the callback after the ack.), after its clicked once to 
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    // sets a callback function for the later acknowlegment by the server 
    //this callback logs the error it gets from the server
    socket.emit('sendMessage', message, (error) => {

        //enables button to be clicked again after acknowlegment, in the callback
        $messageFormButton.removeAttribute('disabled')

        //clears the form
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

//listens the button for location, when its clicked, gets the location and emits to the server 
//so that server can proccess the location and display it 

$sendLocationButton.addEventListener('click', () => {

    //naviagtor.geolocation gets current location but may not be supported by any browser, so needs to be checked
    if (!navigator.geolocation) {
        return alert('Cannot get the location, Geolocation is not supported by your browser')
    }

    //disables button (enabled in the callback after the ack.), after its clicked once to 
    $sendLocationButton.setAttribute('disabled', 'disabled')

    //emits to the server with the location data 
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            
             //enables button to be clicked again after acknowlegment, in the callback
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location info is sent')  
        })
    })
})

//joins a room, the callback function catches the error then alerts
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})