import { EventEmitter } from 'events';

class NotificationEmitter extends EventEmitter {
    private static instance: NotificationEmitter;

    private constructor() {
        super();
        this.setMaxListeners(100); // Allow many concurrent clients
    }

    public static getInstance(): NotificationEmitter {
        if (!NotificationEmitter.instance) {
            NotificationEmitter.instance = new NotificationEmitter();
        }
        return NotificationEmitter.instance;
    }

    public emitNotification(userId: string, notification: any) {
        console.log(`Emitter: Broadcasting to user ${userId}:`, notification.title);
        this.emit(`notification:${userId}`, notification);
    }
}

export const notificationEmitter = NotificationEmitter.getInstance();
