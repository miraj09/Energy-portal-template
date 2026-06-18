import { Card, CardContent } from "@/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Site } from "../types";

interface PlanDetailsSectionProps {
  sites?: Site[];
  onViewMeters?: (site: Site) => void;
  onAddSite?: () => void;
  selectedSiteId?: number | null;
}

const PlanDetailsSection = ({
  sites = [],
  onViewMeters,
  onAddSite,
  selectedSiteId,
}: PlanDetailsSectionProps) => {
  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-[#363636] font-semibold">Site Details</h2>
          {onAddSite ? (
            <button
              type="button"
              onClick={onAddSite}
              className="bg-[#2DB9EB] text-white px-4 py-2 rounded hover:bg-blue-500 text-sm font-medium"
            >
              + Add Site
            </button>
          ) : null}
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary text-primary-foreground">
              <TableHead>Site Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Employee</TableHead>

              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.length > 0 ? (
              sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>{site.sitename}</TableCell>
                  <TableCell>
                    <div>
                      <div>
                        {[
                          site.address_line_1,
                          site.address_line_2,
                          site.address_line_3,
                          site.address_line_4,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{site.total_employee}</TableCell>

                  <TableCell>
                    <button
                      className={`px-4 py-2 rounded text-sm ${
                        selectedSiteId === site.id
                          ? "bg-[#DC3545] hover:bg-[#C82333] text-white"
                          : "bg-[#F5B800] hover:bg-[#E0A500] text-white"
                      }`}
                      onClick={() => onViewMeters && onViewMeters(site)}
                    >
                      {selectedSiteId === site.id
                        ? `Hide Meters (${site.meters.length})`
                        : `View Meters (${site.meters.length})`}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-500 py-8"
                >
                  No sites found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PlanDetailsSection;
