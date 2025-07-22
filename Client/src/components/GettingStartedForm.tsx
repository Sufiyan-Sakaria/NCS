"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Eye, EyeOff } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCreateCompany } from "@/hooks/useCompany";
import { toast } from "sonner";
import axios from "axios";
import { redirect } from "next/navigation";

export function GettingStartedForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const today = new Date();
  const currentYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);

  const createCompanyMutation = useCreateCompany();
  const isSubmitting = createCompanyMutation.isPending;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    branchName: "",
    branchAddress: "",
    userName: "",
    userEmail: "",
    userPassword: "",
  });

  const [financialYearStart, setFinancialYearStart] = useState<Date>(
    new Date(currentYear, 3, 1)
  );
  const [financialYearEnd, setFinancialYearEnd] = useState<Date>(
    new Date(currentYear + 1, 2, 31)
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep((prev) => (prev < 3 ? (prev + 1) as 2 | 3 : prev));
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev > 1 ? (prev - 1) as 1 | 2 : prev));
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      financialYearStart,
      financialYearEnd,
      branchName: formData.branchName,
      branchAddress: formData.branchAddress,
      userName: formData.userName,
      userEmail: formData.userEmail,
      userPassword: formData.userPassword,
    };

    try {
      await createCompanyMutation.mutateAsync(payload);
      toast.success("Company created successfully!");
      redirect("/dashboard");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || error.message || "Failed to create company");
        console.log(error)
      }
    }
  };

  const StepProgress = () => (
    <div className="flex h-2 w-full overflow-hidden rounded-t-lg">
      <div className={cn("flex-1 transition-all", currentStep >= 1 ? "bg-blue-500" : "bg-gray-200")} />
      <div className={cn("flex-1 transition-all", currentStep >= 2 ? "bg-blue-500" : "bg-gray-200")} />
      <div className={cn("flex-1 transition-all", currentStep >= 3 ? "bg-blue-500" : "bg-gray-200")} />
    </div>
  );

  return (
    <div className={cn("flex flex-col items-center w-full px-4", className)} {...props}>
      <div className="rounded-md shadow border w-full max-w-xl">
        <StepProgress />
        <Card className="rounded-t-none">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              {currentStep === 1
                ? "Enter your company details"
                : currentStep === 2
                  ? "Now add your first branch"
                  : "Finally, set up the first user"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1 - Company */}
            {currentStep === 1 && (
              <form onSubmit={handleNext} className="space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="off"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="email">Company Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="off"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label>Financial Year</Label>
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[150px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(financialYearStart, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={financialYearStart}
                            onSelect={(date) => date && setFinancialYearStart(date)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(financialYearEnd, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={financialYearEnd}
                            onSelect={(date) => date && setFinancialYearEnd(date)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Next: Branch"}
                </Button>
              </form>
            )}

            {/* Step 2 - Branch */}
            {currentStep === 2 && (
              <form onSubmit={handleNext} className="space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    name="branchName"
                    autoComplete="off"
                    value={formData.branchName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="branchAddress">Branch Address</Label>
                  <Input
                    id="branchAddress"
                    name="branchAddress"
                    autoComplete="off"
                    value={formData.branchAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Next: Add User"}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3 - User */}
            {currentStep === 3 && (
              <form onSubmit={handleFinish} className="space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="userName">User Name</Label>
                  <Input
                    id="userName"
                    name="userName"
                    autoComplete="off"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="userEmail">User Email</Label>
                  <Input
                    id="userEmail"
                    name="userEmail"
                    type="email"
                    autoComplete="off"
                    value={formData.userEmail}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="userPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="userPassword"
                      name="userPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="off"
                      value={formData.userPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Finish Setup"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
