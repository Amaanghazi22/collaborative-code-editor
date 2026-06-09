import { apiRequest } from "./api.ts";

export const createNewRoom = (data: { name: string }) =>
  apiRequest({ method: "post", url: "/api/rooms/create", data });

export const joinExistingRoom = (data: { roomCode: string }) =>
  apiRequest({ method: "post", url: "/api/rooms/join", data });

export const getMyRooms = () =>
  apiRequest({ method: "get", url: "/api/rooms/my-rooms" });

export const getRoomDetails = (roomId: string) =>
  apiRequest({ method: "get", url: `/api/rooms/${roomId}` });
