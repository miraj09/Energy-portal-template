import { Card, CardContent } from "@/ui/card";
import { ScrollArea, ScrollBar } from "@/ui/scroll-area";
import { UpdateHistory } from "../types";

interface UpdateHistorySectionProps {
  updateHistories: UpdateHistory[];
}

// Local synchronous date formatter: 18-Aug-25
function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  const day = date.getDate().toString().padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mon = months[date.getMonth()];
  const yr = date.getFullYear().toString().slice(-2);
  return `${day}-${mon}-${yr}`;
}

const UpdateHistorySection: React.FC<UpdateHistorySectionProps> = ({
  updateHistories,
}) => {
  const renderOldData = (changeJson: UpdateHistory["change_json"]) => {
    if (!changeJson || changeJson.length === 0) return "";

    const first = changeJson[0];
    return Object.entries(first)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(", ");
  };

  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-[#363636] font-medium">Update History</h2>
        </div>

        {updateHistories.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded border">
            <p className="text-gray-500">No Update History Found</p>
          </div>
        ) : (
          <div className="w-full">
            <ScrollArea className="h-[350px] w-full custom-scrollbar">
              <div className="min-w-full">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left text-sm font-medium text-gray-700 px-4 py-3 border-b w-[15%]">
                        Update Date
                      </th>
                      <th className="text-left text-sm font-medium text-gray-700 px-4 py-3 border-b w-[15%]">
                        Updated By
                      </th>
                      <th className="text-left text-sm font-medium text-gray-700 px-4 py-3 border-b">
                        Old Data
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {updateHistories.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-3 border-b whitespace-nowrap text-black  ">
                          {formatDateShort(item.created_at)}
                        </td>
                        <td className="px-4 py-3 border-b  whitespace-nowrap text-black  ">
                          {item.updated_by_name ||
                            item.created_by_name ||
                            "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b text-black">
                          <div className="text-sm text-gray-700 leading-6 ">
                            {renderOldData(item.change_json)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpdateHistorySection;
