const Notification = require('../models/Notification');

const defaultMessageByType = {
    request_received: 'You received a new trade request.',
    request_accepted: 'Your trade request was accepted.',
    request_declined: 'Your trade request was declined.',
    request_countered: 'A counter offer was sent on your trade request.',
    request_message: 'You received a new message on a trade request.',
    session_reminder: 'Reminder: you have a session in the next 24 hours.',
    noshow_alert: 'A no-show report has been filed.',
    dispute_filed: 'A dispute has been filed for one of your exchanges.',
    credits_awarded: 'Credits were added to your account.',
    exchange_completed: 'Your exchange has been marked completed.',
    global_learning_request: 'A community learning request matches your skills.',
    global_learning_request_accepted: 'Someone accepted your community learning request.',
    global_learning_request_closed: 'A community learning request was closed.'
};

const sendNotification = async (userId, type, data = {}, deps = {}) => {
    if (!userId) return null;
    const NotificationModel = deps.NotificationModel || Notification;
    const message = data.message || defaultMessageByType[type] || 'You have a new notification.';

    return NotificationModel.create({
        userId,
        type,
        relatedId: data.relatedId || null,
        message,
        read: false
    });
};

const sendNotificationToMany = async (userIds, type, data = {}, deps = {}) => {
    const uniqueIds = [...new Set((userIds || []).map((id) => id && id.toString()).filter(Boolean))];
    if (uniqueIds.length === 0) return [];

    return Promise.all(uniqueIds.map((id) => sendNotification(id, type, data, deps)));
};

module.exports = {
    sendNotification,
    sendNotificationToMany
};
