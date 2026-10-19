const INITIAL_STATE = { rooms: [], selectedRoom: {} };

const chatsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_ROOMS":
      return { ...state, rooms: action.payload };
    case "SELECT_ROOM":
      return {
        ...state,
        selectedRoom: state.rooms.find((room) => room.id == action.payload),
      };
    case "APPEND_MESSAGES":
      return {
        ...state,
        selectedRoom: {
          ...state.selectedRoom,
          messages: action.payload,
          lastMessage: action.payload[action.payload.length - 1],
        },
      };

    default:
      return { ...state };
  }
};
export default chatsReducer;
