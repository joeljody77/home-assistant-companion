import { cn } from "@/lib/utils";

interface RoomTabsProps {
  rooms: string[];
  activeRoom: string;
  onRoomChange: (room: string) => void;
}

export const RoomTabs = ({ rooms, activeRoom, onRoomChange }: RoomTabsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {rooms.map((room) => (
        <button
          key={room}
          onClick={() => onRoomChange(room)}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
            activeRoom === room
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {room}
        </button>
      ))}
    </div>
  );
};
