import type { User, Chat, Message } from './types';

export const currentUser: User = {
  id: 'user1',
  name: 'You',
  avatar: 'https://placehold.co/100x100.png',
};

const otherUsers: User[] = [
  { id: 'user2', name: 'Alice', avatar: 'https://placehold.co/100x100.png' },
  { id: 'user3', name: 'Bob', avatar: 'https://placehold.co/100x100.png' },
  { id: 'user4', name: 'Charlie', avatar: 'https://placehold.co/100x100.png' },
  { id: 'user5', name: 'Diana', avatar: 'https://placehold.co/100x100.png' },
  { id: 'user6', name: 'Team Updates', avatar: 'https://placehold.co/100x100.png' },
  { id: 'user7', name: 'Project Phoenix', avatar: 'https://placehold.co/100x100.png' },
];

export const chats: Chat[] = [
  {
    id: 'chat1',
    users: [currentUser, otherUsers[0]],
    lastMessage: "Hey, how's it going?",
    lastMessageTimestamp: '10:40 AM',
    unreadCount: 2,
  },
  {
    id: 'chat2',
    users: [currentUser, otherUsers[1]],
    lastMessage: 'See you tomorrow!',
    lastMessageTimestamp: 'Yesterday',
    unreadCount: 0,
  },
  {
    id: 'chat3',
    users: [currentUser, otherUsers[2]],
    lastMessage: 'Thanks for the help!',
    lastMessageTimestamp: 'Tuesday',
    unreadCount: 1,
  },
  {
    id: 'chat4',
    users: [currentUser, otherUsers[3]],
    lastMessage: "Let's catch up soon.",
    lastMessageTimestamp: 'Monday',
    unreadCount: 0,
  },
  {
    id: 'chat5',
    users: [currentUser, otherUsers[4]],
    lastMessage: 'The event was a success!',
    lastMessageTimestamp: '3/15/24',
    unreadCount: 0,
  },
  {
    id: 'chat6',
    users: [currentUser, otherUsers[5]],
    lastMessage: 'Remember the deadline is EOD Friday.',
    lastMessageTimestamp: '3/14/24',
    unreadCount: 5,
  },
];

export const messages: Message[] = [
  {
    id: 'msg1',
    chatId: 'chat1',
    sender: otherUsers[0],
    text: 'Hey!',
    timestamp: '10:30 AM',
  },
  {
    id: 'msg2',
    chatId: 'chat1',
    sender: currentUser,
    text: "Hey, how's it going?",
    timestamp: '10:40 AM',
  },
  {
    id: 'msg3',
    chatId: 'chat2',
    sender: otherUsers[1],
    text: 'Meeting confirmed for 10am.',
    timestamp: 'Yesterday',
  },
  {
    id: 'msg4',
    chatId: 'chat2',
    sender: currentUser,
    text: 'See you tomorrow!',
    timestamp: 'Yesterday',
  },
  {
    id: 'msg5',
    chatId: 'chat3',
    sender: otherUsers[2],
    text: 'Here is the file you requested.',
    timestamp: 'Tuesday',
  },
  {
    id: 'msg6',
    chatId: 'chat3',
    sender: currentUser,
    text: 'Thanks for the help!',
    timestamp: 'Tuesday',
  },
  {
    id: 'msg7',
    chatId: 'chat4',
    sender: currentUser,
    text: "Let's catch up soon.",
    timestamp: 'Monday',
  },
  {
    id: 'msg8',
    chatId: 'chat5',
    sender: otherUsers[4],
    text: 'The event was a success!',
    timestamp: '3/15/24',
  },
  {
    id: 'msg9',
    chatId: 'chat6',
    sender: otherUsers[5],
    text: 'Remember the deadline is EOD Friday.',
    timestamp: '3/14/24',
  },
];
