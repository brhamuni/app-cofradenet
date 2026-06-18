import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/ubicacion' })
export class UbicacionGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('join-procesion')
    handleJoin(@MessageBody() data: { procesionId: number }, @ConnectedSocket() client: Socket) {
        const room = `procesion-${data.procesionId}`;
        client.join(room);
        client.emit('joined', { room });
    }

    @SubscribeMessage('leave-procesion')
    handleLeave(@MessageBody() data: { procesionId: number }, @ConnectedSocket() client: Socket) {
        client.leave(`procesion-${data.procesionId}`);
    }

    emitUbicacionActualizada(procesionId: number, payload: any) {
        this.server.to(`procesion-${procesionId}`).emit('ubicacion-actualizada', payload);
    }

    emitEstadoPasoActualizado(procesionId: number, payload: any) {
        this.server.to(`procesion-${procesionId}`).emit('estado-paso-actualizado', payload);
    }
}
