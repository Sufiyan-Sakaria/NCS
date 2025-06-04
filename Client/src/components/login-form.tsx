import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, User, MapPin, EyeOff, Eye } from "lucide-react";
import type Company from '@/types/Company';
import { useQuery } from '@tanstack/react-query';
import { GetAllBranchesByCompany, GetAllCompanies } from '@/api/axios';
import type Branch from '@/types/Branch';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get Company Data
  const { data: Companies, isLoading: companiesLoading, error: companiesError } = useQuery({
    queryKey: ["Companies"],
    queryFn: GetAllCompanies
  })

  // Get Branch Data - Fixed the logic error here
  const { data: Branches, isLoading: branchesLoading, error: branchesError } = useQuery({
    queryKey: ["Branches", selectedCompany?.id],
    queryFn: () => GetAllBranchesByCompany(selectedCompany!.id),
    enabled: !!selectedCompany?.id, // Fixed: should be selectedCompany, not selectedBranch
  });

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCredentialsSubmit = async () => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsLoading(false);
    handleNextStep();
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);

    // Simulate final login API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsLoading(false);
    console.log('Login successful:', {
      company: selectedCompany,
      credentials,
      branch: selectedBranch
    });

    // Here you would typically redirect or update auth state
    alert('Login successful!');
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <Building2 className="h-5 w-5" />;
      case 2: return <User className="h-5 w-5" />;
      case 3: return <MapPin className="h-5 w-5" />;
      default: return null;
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Select Company";
      case 2: return "Enter Credentials";
      case 3: return "Choose Branch";
      default: return "";
    }
  };

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1: return "Choose your organization to continue";
      case 2: return "Enter your email and password";
      case 3: return "Select your preferred branch";
      default: return "";
    }
  };

  // Handle loading and error states
  if (companiesLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", className)} {...props}>
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-6 text-center">
              <div>Loading companies...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (companiesError) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", className)} {...props}>
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-500">Error loading companies. Please try again.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4", className)} {...props}>
      <div className="w-full max-w-md">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevStep}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                {getStepIcon(currentStep)}
                <div>
                  <CardTitle className="text-xl">{getStepTitle(currentStep)}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{getStepDescription(currentStep)}</p>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors",
                    step <= currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Step 1: Company Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Choose your company</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Fixed: Added proper null checking and data structure handling */}
                    {Companies?.data && Array.isArray(Companies.data) ? (
                      Companies.data.map((company: Company, index: number) => {
                        const total = Companies.data.length;
                        const isLastOfThree = total === 3 && index === 2;
                        const isSingle = total === 1;

                        return (
                          <Button
                            key={company.id}
                            variant={selectedCompany?.id === company.id ? "default" : "outline"}
                            className={cn(
                              "h-auto p-3 flex-col gap-2",
                              isSingle || isLastOfThree ? "col-span-2" : "col-span-1"
                            )}
                            onClick={() => {
                              setSelectedCompany(company);
                              setTimeout(() => handleNextStep(), 300);
                            }}
                          >
                            <Building2 className="h-5 w-5" />
                            <div className="text-center">
                              <div className="font-medium text-sm leading-tight">{company.name}</div>
                              <div className="text-xs opacity-70 mt-1">{company.email}</div>
                            </div>
                          </Button>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center text-muted-foreground">
                        No companies available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Email and Password */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {selectedCompany && (
                  <div className="p-3 bg-muted rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{selectedCompany.name}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials((prev) => ({ ...prev, password: e.target.value }))
                      }
                      className="pr-10" // extra space for the icon
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleCredentialsSubmit}
                  className="w-full"
                  disabled={isLoading || !credentials.email || !credentials.password}
                >
                  {isLoading ? "Verifying..." : "Verify Credentials"}
                </Button>
              </div>
            )}

            {/* Step 3: Branch Selection */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {selectedCompany && (
                  <div className="p-3 bg-muted rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{selectedCompany.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{credentials.email}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Select Branch</Label>
                  {branchesLoading ? (
                    <div className="text-center p-4 text-muted-foreground">
                      Loading branches...
                    </div>
                  ) : branchesError ? (
                    <div className="text-center p-4 text-red-500">
                      Error loading branches
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 gap-y-2">
                      {/* Fixed: Added proper null checking for branches */}
                      {Branches && Array.isArray(Branches) && Branches.length > 0 ? (
                        Branches.map((branch: Branch, index: number) => {
                          const total = Branches.length;
                          const isLastOfThree = total === 3 && index === 2;
                          const isSingle = total === 1;

                          return (
                            <div
                              key={branch.id}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                                selectedBranch?.id === branch.id ? "border-primary bg-primary/5" : "border-border",
                                isSingle || isLastOfThree ? "col-span-2" : "col-span-1"
                              )}
                              onClick={() => setSelectedBranch(branch)}
                            >
                              <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-sm">{branch.name}</div>
                                  <div className="text-xs text-muted-foreground">{branch.address}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })


                      ) : (
                        <div className="col-span-2 text-center text-muted-foreground">
                          No branches available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleFinalSubmit}
                  className="w-full"
                  disabled={isLoading || !selectedBranch}
                >
                  {isLoading ? "Logging in..." : "Complete Login"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}