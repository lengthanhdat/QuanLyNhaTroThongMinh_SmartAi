import { 
  WebSocketGateway, 
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // console.log('Notification client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    // console.log('Notification client disconnected:', client.id);
  }

  // Phương thức để service gọi khi có thông báo mới
  sendNotification(notification: any) {
    this.server.emit('new_notification', notification);
  }
}
