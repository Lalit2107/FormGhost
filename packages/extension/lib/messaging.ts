import { MessageType } from '@formghost/shared';

/**
 * Typed wrapper for sending messages within the extension.
 */
export async function sendMessage<T = any>(message: MessageType): Promise<T> {
  return chrome.runtime.sendMessage(message);
}
