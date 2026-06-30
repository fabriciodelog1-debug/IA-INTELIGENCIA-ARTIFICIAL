export type PersonaId = "jarvis" | "friday";

export interface Persona {
  id: PersonaId;
  name: string;
  greet: string;
  gender: "male" | "female";
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface SmartDevice {
  id: string;
  name: string;
  type: "light" | "ac" | "gate" | "tv" | "camera";
  room: string;
  status: boolean;
}

export interface TopicKeywordMap {
  [key: string]: string[];
}
