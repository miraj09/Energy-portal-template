import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Pagination } from "../../ui";
// import Image from "next/image"

// API response type
type ApiAnnouncement = {
  id: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  is_active: boolean;
  category: string;
  subject: string;
  message: string;
  is_for_all: boolean;
  created_by: string | null;
  deleted_by: string | null;
  users: unknown[];
};

// Props interface
interface AnnouncementsProps {
  announcements: ApiAnnouncement[];
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

const Announcements = ({
  announcements,
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading,
}: AnnouncementsProps) => {
  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleString("en-US", { month: "short" });
      const year = date.getFullYear().toString().slice(-2);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");

      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return "Invalid Date";
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Helper function to render HTML content safely
  const renderHtmlContent = (htmlString: string) => {
    return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <Card className="w-full shadow-md bg-white mt-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-[#363636] font-['Plus_Jakarta_Sans',Helvetica]">
            All Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No announcements found
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:gap-4">
                {announcements.map((announcement) => (
                  <Card
                    key={announcement.id}
                    className="border-[0.5px] border-[#0066ff] rounded-[10px] min-h-[150px] sm:min-h-[174px]"
                  >
                    <CardContent className="p-0 relative">
                      <div className="p-2 sm:p-2.5">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                          <h3 className="font-semibold text-black text-base sm:text-lg leading-4 sm:leading-5 w-full sm:w-[484px] [font-family:'Inter',Helvetica]">
                            {announcement.subject}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 self-start sm:self-auto">
                            <span className="text-xs sm:text-sm text-primary font-medium bg-primary/10 px-2 py-1 rounded-md [font-family:'Inter',Helvetica]">
                              {announcement.category}
                            </span>
                            <span className="text-xs sm:text-sm text-neutral-500 [-webkit-text-stroke:1px_#737373] [font-family:'Inter',Helvetica]">
                              {formatDate(announcement.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-black [font-family:'Inter',Helvetica] mt-3 sm:mt-4 w-full sm:w-[1025px]">
                          {renderHtmlContent(announcement.message)}
                        </div>
                        <div className="mt-3 sm:mt-4 relative">
                          {/* <Image
                            width={11}
                            height={1}
                            className="absolute w-[11px] h-px top-[11px] left-0"
                            alt="Line"
                            src="/line-7.svg"
                          /> */}
                          <span className="ml-[15px] text-[8px] text-neutral-500 [font-family:'Inter',Helvetica] hidden">
                            {formatTimestamp(announcement.created_at)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Announcements;
