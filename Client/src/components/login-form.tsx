import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, User, MapPin, EyeOff, Eye } from "lucide-react";
import type Company from "@/types/Company";
import type Branch from "@/types/Branch";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GetAllBranchesByCompany, GetAllCompanies, Login } from "@/api/axios";

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

  const {
    data: Companies,
    isLoading: companiesLoading,
    error: companiesError,
  } = useQuery({
    queryKey: ["Companies"],
    queryFn: GetAllCompanies,
  });

  const {
    data: Branches,
    isLoading: branchesLoading,
    error: branchesError,
  } = useQuery({
    queryKey: ["Branches", selectedCompany?.id],
    queryFn: () => GetAllBranchesByCompany(selectedCompany!.id),
    enabled: !!selectedCompany?.id,
  });

  const loginMutation = useMutation({
    mutationKey: ["login"],
    mutationFn: Login,
    onSuccess: (data) => {
      localStorage.setItem("token", data.data.token as string);
      handleNextStep();
    },
    onError: (error) => {
      console.error("Login failed:", error);
      alert("Invalid credentials");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleNextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handlePrevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleCredentialsSubmit = () => {
    const { email, password } = credentials;
    if (!email || !password) return;
    setIsLoading(true);
    loginMutation.mutate({ email, password });
  };

  const handleFinalSubmit = async () => {
    if (!selectedBranch) return;

    setIsLoading(true);
    // Store branch selection (in localStorage, context, etc.)
    localStorage.setItem("selectedBranch", JSON.stringify(selectedBranch));
    localStorage.setItem("selectedCompany", JSON.stringify(selectedCompany));
    localStorage.setItem("userEmail", credentials.email);

    // Redirect or notify parent
    setTimeout(() => {
      setIsLoading(false);
      console.log("Login flow completed");
      window.location.href = "/dashboard"; // Or use router.push if using Next.js
    }, 1000);
  };

  const getStepIcon = (step: number) =>
    step === 1 ? (
      <Building2 className="h-5 w-5" />
    ) : step === 2 ? (
      <User className="h-5 w-5" />
    ) : step === 3 ? (
      <MapPin className="h-5 w-5" />
    ) : null;

  const getStepTitle = (step: number) =>
    step === 1
      ? "Select Company"
      : step === 2
      ? "Enter Credentials"
      : step === 3
      ? "Choose Branch"
      : "";

  const getStepDescription = (step: number) =>
    step === 1
      ? "Choose your organization to continue"
      : step === 2
      ? "Enter your email and password"
      : step === 3
      ? "Select your preferred branch"
      : "";

  if (companiesLoading) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center p-4",
          className
        )}
        {...props}
      >
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-6 text-center">
              Loading companies...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (companiesError) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center p-4",
          className
        )}
        {...props}
      >
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-6 text-center text-red-500">
              Failed to load companies. Please try again later.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4",
        className
      )}
      {...props}
    >
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
                  <CardTitle className="text-xl">
                    {getStepTitle(currentStep)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getStepDescription(currentStep)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    step <= currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {Companies?.data?.length > 0 ? (
                    Companies.data.map((company: Company, index: number) => {
                      const isSingle = Companies.data.length === 1;
                      const isLastOfThree =
                        Companies.data.length === 3 && index === 2;
                      return (
                        <Button
                          key={company.id}
                          variant={
                            selectedCompany?.id === company.id
                              ? "default"
                              : "outline"
                          }
                          className={cn(
                            "h-auto p-3 flex-col gap-2",
                            isSingle || isLastOfThree
                              ? "col-span-2"
                              : "col-span-1"
                          )}
                          onClick={() => {
                            setSelectedCompany(company);
                            setTimeout(handleNextStep, 300);
                          }}
                        >
                          <Building2 className="h-5 w-5" />
                          <div className="text-center">
                            <div className="font-medium text-sm">
                              {company.name}
                            </div>
                            <div className="text-xs opacity-70 mt-1">
                              {company.email}
                            </div>
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
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                {selectedCompany && (
                  <div className="p-3 bg-muted rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {selectedCompany.name}
                      </span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={credentials.email}
                    placeholder="your@email.com"
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="pr-10"
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
                  disabled={
                    isLoading || !credentials.email || !credentials.password
                  }
                >
                  {isLoading ? "Verifying..." : "Verify Credentials"}
                </Button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                {selectedCompany && (
                  <div className="p-3 bg-muted rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {selectedCompany.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {credentials.email}
                      </span>
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
                    <div className="grid grid-cols-2 gap-2">
                      {Branches?.data?.length > 0 ? (
                        Branches.data.map((branch: Branch, index: number) => {
                          const isSingle = Branches.data.length === 1;
                          const isLastOfThree =
                            Branches.data.length === 3 && index === 2;
                          return (
                            <div
                              key={branch.id}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                                selectedBranch?.id === branch.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border",
                                isSingle || isLastOfThree
                                  ? "col-span-2"
                                  : "col-span-1"
                              )}
                              onClick={() => setSelectedBranch(branch)}
                            >
                              <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-sm">
                                    {branch.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {branch.address}
                                  </div>
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
