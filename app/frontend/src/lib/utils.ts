import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toPusherKey(key: string) {
  return key.replace(/:/g, '__')
}

export const generateShortId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};
export function chatHrefConstructor(id1: string, id2: string) {
  const sortedIds = [id1, id2].sort()
  return `${sortedIds[0]}--${sortedIds[1]}`
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  
  const isValidFormat = emailRegex.test(email);
  if (!isValidFormat) return false;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) return false;
  
  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;
  if (domainParts[domainParts.length - 1].length < 2) return false;
  
  return true;
}

export function trimWhitespace(input: string | null | undefined, options: {
  all?: boolean;          // Remove all whitespace
  ends?: boolean;         // Trim ends only
  multiple?: boolean;     // Reduce multiple spaces to single
  preserveNewlines?: boolean; // Keep line breaks when removing whitespace
} = {
  all: false,
  ends: true,
  multiple: true,
  preserveNewlines: true,
}): string {
  if (input == null) return '';
  
  let result = input;

  // Trim ends by default
  if (options.ends || options.all) {
    result = result.trim();
  }

  // Handle multiple spaces
  if (options.multiple) {
    if (options.preserveNewlines) {
      // Replace multiple spaces while preserving newlines
      result = result.split('\n').map(line => {
        return line.replace(/\s+/g, ' ').trim();
      }).join('\n');
      
      // Remove extra newlines
      result = result.replace(/\n+/g, '\n');
    } else {
      // Replace all whitespace with single space
      result = result.replace(/\s+/g, ' ');
    }
  }

  // Remove all whitespace if specified
  if (options.all) {
    result = options.preserveNewlines 
      ? result.split('\n').map(line => line.replace(/\s/g, '')).join('\n')
      : result.replace(/\s/g, '');
  }

  return result;
}


