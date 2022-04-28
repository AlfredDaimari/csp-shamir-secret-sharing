// file for handling clien necessities, will contain all functions needed


var SOCKET = undefined
var ROOM_INFO = undefined

// connect to socket
function connSOC(type, room, users, mkeys) {
    SOCKET = io();
    const roomID_div = document.getElementById('room_id');
    const alwUsers_div = document.getElementById('alw_users');
    const uDisp_div = document.getElementById('users_display');
    const scDisp_div = document.getElementById('scatter_info')
    const myID = document.getElementById('my_id')
    const fgDisp_div = document.getElementById('forge_info')
    const fgInp_div = document.getElementById('forge_input_div')
    const fgDispSec_div = document.getElementById('forge_display_div')


    // backend connection
    SOCKET.on('connect', () => {
        console.info(`connected to soc -- my id -> ${SOCKET.id} -- ${Date()}`)

        if (type == 'new') {
            SOCKET.emit('client:new_room', { room, users, mkeys })
        } else {
            SOCKET.emit('client:join_room', room)
        }
    })


    // code for updating the room info
    SOCKET.on('client:room_update', info => {
        ROOM_INFO = info
        console.info(ROOM_INFO)

        /**
         * code for updating the room status
         */
        roomID_div.innerHTML = `ROOM <span class="text-zinc-500"> ${ROOM_INFO.id} </span>`
        alwUsers_div.innerHTML = `ROOM SIZE <span class="text-zinc-500"> ${ROOM_INFO.users} </span>`
        myID.innerHTML = `MY ID <span class="text-zinc-500"> ${SOCKET.id} </span>`

        let uInnerHtmlStr = '' // update inner html
        for (let user of ROOM_INFO.cur_users) {
            uInnerHtmlStr += `<p> &bull; ${user} </p>`
        }
        for (let i = 0; i < (ROOM_INFO.users - ROOM_INFO.cur_users.length); i++) {
            uInnerHtmlStr += `<p class="text-orange-700"> &bull; Waiting for user 
            <span class="animate-ping"> &#9940; </span> </p>`
        }

        uDisp_div.innerHTML = uInnerHtmlStr


        /**
         * code for updating the scatter secret status
         */
        let userScatterStatus = {}
        for (let user of ROOM_INFO.cur_users) {
            userScatterStatus[user] = false
        }

        for (let user of ROOM_INFO.create) {
            userScatterStatus[user] = true
        }

        let scInnerHtmlStr = ''
        for (let user in userScatterStatus) {
            if (userScatterStatus[user]) {
                scInnerHtmlStr += `<p> &bull; ${user} ✅</p>`
            } else {
                scInnerHtmlStr += `<p class="text-orange-700"> &bull; ${user} ❌</p>`
            }
        }
        for (let i = 0; i < (ROOM_INFO.users - ROOM_INFO.cur_users.length); i++) {
            scInnerHtmlStr += `<p class="text-orange-700"> &bull; Waiting for user 
            <span class="animate-ping"> &#9940; </span> </p>`
        }
        scDisp_div.innerHTML = scInnerHtmlStr

        /**
         * code for updating the forge secret status
         */
        let fgInnerHtmlStr = ''
        for (let user of ROOM_INFO.forge) {
            fgInnerHtmlStr += `<p> &bull; ${user} share ✅</p>`
        }
        for (let i = 0; i < (ROOM_INFO.mkeys - ROOM_INFO.forge.length); i++) {
            fgInnerHtmlStr += `<p class="text-orange-700"> &bull; Waiting for user to send share 
            <span class="animate-ping"> &#9940; </span> </p>`
        }
        fgDisp_div.innerHTML = fgInnerHtmlStr

        if (ROOM_INFO.forge.length == ROOM_INFO.mkeys) {
            fgInp_div.hidden = true
            fgDispSec_div.hidden = false
        }

    })

    // for getting key share secret
    SOCKET.on('secret:key_share', share => {
        const shareDis = document.getElementById('share_display')

        shareDis.innerHTML = `<p> a: ${share.a}</p> <p> b: ${share.b} </p> <p> c: ${share.p}</p>`
    })

    SOCKET.on('secret:forged_secret', secret => {
        const forgSecDis = document.getElementById('forge_display')

        forgSecDis.innerHTML = `<p> forged secret is ${secret} </p>`
    })

    // for forging the secret
}

function joinRoom() {
    const room_id = document.getElementById('room_id').value
    if (room_id == "") {
        alert('error: you have not entered room-id')
    } else {
        window.location.href = `/secret.html?type=old&room=${room_id}`
    }
}

function createRoom() {
    const min_keys = document.getElementById('min_keys').value
    const num_users = document.getElementById('num_users').value

    if (min_keys == 0 || num_users == 0) {
        alert('error: you have not entered some value')
    } else if (parseInt(min_keys) > parseInt(num_users)) {
        alert('error: minimum keys > num of users')
    }
    else {
        window.location.href = `/secret.html?type=new&users=${num_users}&mkeys=${min_keys}`
    }
}

function secSetupRoom() {
    // taking query string input
    let queryStrings = new URLSearchParams(window.location.href.split("?")[1])
    let queryParams = {}
    for (let pair of queryStrings.entries()) {
        queryParams[pair[0]] = pair[1]
    }

    connSOC(queryParams["type"], queryParams["room"], queryParams["users"], queryParams["mkeys"])
}

function createSecret() {
    // creating a secret and sending it to backend
    const shareDisDiv = document.getElementById('share_display_div')
    const shareInp = document.getElementById('share_input').value
    const shareInpDiv = document.getElementById('share_input_div')

    SOCKET.emit('secret:create', { id: ROOM_INFO.id, secret: shareInp })
    shareDisDiv.hidden = false
    shareInpDiv.hidden = true
}

function sendForgeShare() {
    const forgeInpDiv = document.getElementById('forge_input_div')
    const forgeDisDiv = document.getElementById('forge_display_div')
    const a = document.getElementById('forge_a').value
    const b = document.getElementById('forge_b').value
    const p = document.getElementById('forge_p').value

    SOCKET.emit("secret:forge", {
        id: ROOM_INFO.id,
        a,
        b,
        p
    })
    forgeInpDiv.hidden = true
    forgeDisDiv.hidden = false

}

function navClick(show) {
    const scatter = document.getElementById('scatter')
    const forge = document.getElementById('forge')
    if (show == 'scatter') {
        scatter.hidden = false
        forge.hidden = true
    } else {
        scatter.hidden = true
        forge.hidden = false
    }
}