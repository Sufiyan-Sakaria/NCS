import { Calendar, CalendarDays, Mail, MapIcon, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { useCompany } from "@/hooks/useCompany";
import { useActiveCompanyId } from "@/hooks/UseActive";

const CompanyHeader = () => {
  const companyId = useActiveCompanyId();
  const { data: company } = useCompany(companyId);

  return (
    <Card className="print:shadow-none print:border-2 print:border-black py-2">
      <CardHeader className="flex items-center justify-center print:pb-2">
        <div className="flex justify-between items-start w-full">
          <div className="space-y-1 flex-1">
            <div>
              <CardTitle className="text-4xl font-bold text-primary print:text-black print:text-2xl">
                {company?.name || "Company Name"}
              </CardTitle>
              {company?.email && (
                <div className="flex items-center gap-2 text-muted-foreground print:text-black">
                  <Mail className="w-4 h-4 print:w-3 print:h-3" />
                  <span className="text-lg print:text-sm">{company.email}</span>
                </div>
              )}
            </div>

            {/* Company Timeline */}
            {company && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground print:text-black print:text-xs">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Since: {new Date(company.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Company Details Sections - Simplified for print */}
      {(company?.branches?.length || company?.financialYears?.length || company?.users?.length) && (
        <CardContent className="print:pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-3">
            {/* Branches Section */}
            {company?.branches && company.branches.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3 print:text-sm print:mb-2">
                  <MapIcon className="w-4 h-4 print:w-3 print:h-3" />
                  Branches ({company.branches.length})
                </h4>
                <div className="space-y-2 print:space-y-1">
                  {company.branches.slice(0, 2).map((branch) => (
                    <div key={branch.id} className="p-2 border rounded-md print:p-1 print:text-xs">
                      <p className="font-medium text-sm print:text-xs">{branch.name}</p>
                      {branch.address && (
                        <p className="text-xs text-muted-foreground print:text-black">
                          {branch.address}
                        </p>
                      )}
                    </div>
                  ))}
                  {company.branches.length > 2 && (
                    <p className="text-xs text-muted-foreground print:text-black">
                      +{company.branches.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Financial Years Section */}
            {company?.financialYears && company.financialYears.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3 print:text-sm print:mb-2">
                  <CalendarDays className="w-4 h-4 print:w-3 print:h-3" />
                  Financial Years ({company.financialYears.length})
                </h4>
                <div className="space-y-2 print:space-y-1">
                  {company.financialYears.slice(0, 2).map((fy) => (
                    <div key={fy.id} className="p-2 border rounded-md print:p-1">
                      <div className="text-xs text-muted-foreground print:text-black">
                        {new Date(fy.startDate).toLocaleDateString()} -{" "}
                        {new Date(fy.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {company.financialYears.length > 2 && (
                    <p className="text-xs text-muted-foreground print:text-black">
                      +{company.financialYears.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Users Section */}
            {company?.users && company.users.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3 print:text-sm print:mb-2">
                  <Users className="w-4 h-4 print:w-3 print:h-3" />
                  Team Members ({company.users.length})
                </h4>
                <div className="space-y-2 print:space-y-1">
                  {company.users.slice(0, 2).map((user) => (
                    <div key={user.id} className="p-2 border rounded-md print:p-1 print:text-xs">
                      <p className="font-medium text-sm print:text-xs">{user.name}</p>
                      <p className="text-xs text-muted-foreground print:text-black">{user.email}</p>
                      {user.role && (
                        <Badge
                          variant="outline"
                          className="text-xs mt-1 print:border-black print:text-black"
                        >
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {company.users.length > 2 && (
                    <p className="text-xs text-muted-foreground print:text-black">
                      +{company.users.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CompanyHeader;
