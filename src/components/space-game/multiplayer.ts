// Multiplayer system using Supabase Realtime
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RemotePlayer {
  id: string;
  x: number;
  y: number;
  angle: number;
  thrust: boolean;
  name: string;
  hp: number;
  maxHp: number;
  lastUpdate: number;
}

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  time: number;
}

let channel: RealtimeChannel | null = null;
const remotePlayers = new Map<string, RemotePlayer>();
let localId: string = '';
const chatMessages: ChatMessage[] = [];
const MAX_CHAT_MESSAGES = 20;
let onChatCallback: (() => void) | null = null;

export function getChatMessages(): ChatMessage[] {
  const now = Date.now();
  // Remove messages older than 30s
  while (chatMessages.length > 0 && now - chatMessages[0].time > 30000) {
    chatMessages.shift();
  }
  return chatMessages;
}

export function getRemotePlayers(): RemotePlayer[] {
  const now = Date.now();
  for (const [id, p] of remotePlayers) {
    if (now - p.lastUpdate > 5000) remotePlayers.delete(id);
  }
  return Array.from(remotePlayers.values());
}

export function setOnChat(cb: (() => void) | null) {
  onChatCallback = cb;
}

export function initMultiplayer(userId: string, userName: string) {
  localId = userId;

  channel = supabase.channel('game-room', {
    config: { presence: { key: userId } }
  });

  channel.on('broadcast', { event: 'player-state' }, ({ payload }) => {
    if (payload.id === localId) return;
    remotePlayers.set(payload.id, {
      ...payload,
      lastUpdate: Date.now(),
    });
  });

  channel.on('broadcast', { event: 'chat-message' }, ({ payload }) => {
    if (chatMessages.length >= MAX_CHAT_MESSAGES) chatMessages.shift();
    chatMessages.push({
      id: payload.id,
      name: payload.name,
      text: payload.text,
      time: Date.now(),
    });
    onChatCallback?.();
  });

  channel.on('presence', { event: 'leave' }, ({ key }) => {
    remotePlayers.delete(key);
  });

  channel.subscribe();
}

export function sendChatMessage(text: string, name: string) {
  if (!channel || !text.trim()) return;
  const msg: ChatMessage = {
    id: localId,
    name,
    text: text.trim().substring(0, 100),
    time: Date.now(),
  };
  chatMessages.push(msg);
  if (chatMessages.length > MAX_CHAT_MESSAGES) chatMessages.shift();
  
  channel.send({
    type: 'broadcast',
    event: 'chat-message',
    payload: msg,
  });
}

export function broadcastState(ship: { x: number; y: number; angle: number; thrust: boolean; hp: number; maxHp: number }, name: string) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'player-state',
    payload: {
      id: localId,
      x: ship.x,
      y: ship.y,
      angle: ship.angle,
      thrust: ship.thrust,
      hp: ship.hp,
      maxHp: ship.maxHp,
      name,
    }
  });
}

export function cleanupMultiplayer() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  remotePlayers.clear();
  chatMessages.length = 0;
  onChatCallback = null;
}
