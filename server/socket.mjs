import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors())
app.get('/', (_, res) => res.send('Socket server OK'))

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: ['http://localhost:3000'], methods: ['GET','POST'] }
})

// mémoire simple: historique par room
const rooms = new Map() // roomId -> [{user, text|dataUrl, kind, ts}]

io.on('connection', (socket) => {
  socket.emit('hello', { ts: Date.now() })

  socket.on('room:join', ({ roomId, user }) => {
    socket.join(roomId)
    if (!rooms.has(roomId)) rooms.set(roomId, [])
    socket.emit('room:joined', { roomId, history: rooms.get(roomId) || [] })
    socket.to(roomId).emit('message:new', {
      roomId, user: 'system', text: `${user.pseudo} a rejoint`, kind: 'text', ts: Date.now()
    })
  })

  socket.on('message:send', ({ roomId, user, text }) => {
    const msg = { roomId, user: user.pseudo, text, kind: 'text', ts: Date.now() }
    rooms.get(roomId)?.push(msg)
    io.to(roomId).emit('message:new', msg)
  })

  socket.on('photo:send', ({ roomId, user, dataUrl }) => {
    const msg = { roomId, user: user.pseudo, dataUrl, kind: 'photo', ts: Date.now() }
    rooms.get(roomId)?.push(msg)
    io.to(roomId).emit('photo:new', msg)
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log('Socket server on http://localhost:' + PORT))
