"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Building, GitBranch, Building2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

type Company = {
    id: string
    name: string
}

type Branch = {
    id: string
    name: string
    companyId: string
}

const mockCompanies: Company[] = [
    { id: "1", name: "Acme Inc" },
    { id: "2", name: "Globex Corporation" },
    { id: "3", name: "Soylent Corp" },
]

const mockBranches: Branch[] = [
    { id: "1", name: "Headquarters", companyId: "1" },
    { id: "2", name: "North Branch", companyId: "1" },
    { id: "3", name: "Main Office", companyId: "2" },
    { id: "4", name: "Production Facility", companyId: "3" },
]

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [selectedCompany, setSelectedCompany] = useState<string>("")
    const [selectedBranch, setSelectedBranch] = useState<string>("")
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // Simulate authentication
        setTimeout(() => {
            setIsAuthenticated(true)
            setIsLoading(false)
        }, 1000)
    }

    const handleBranchSelect = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // Simulate branch selection
        setTimeout(() => {
            setIsLoading(false)
            // Here you would typically redirect to the dashboard
            alert(`Logged in to ${selectedBranch}`)
        }, 500)
    }

    const filteredBranches = mockBranches.filter(
        (branch) => branch.companyId === selectedCompany
    )

    return (
        <div className={cn("flex flex-col gap-5", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>
                        {!isAuthenticated
                            ? "Select your company and login"
                            : "Select your branch to continue"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isAuthenticated ? (
                        <form onSubmit={handleLogin}>
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="company">Company</Label>
                                    <Select
                                        value={selectedCompany}
                                        onValueChange={setSelectedCompany}
                                        required
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockCompanies.map((company) => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4" />
                                                        {company.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedCompany && (
                                    <>
                                        <div className="grid gap-3">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="m@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <div className="flex items-center">
                                                <Label htmlFor="password">Password</Label>
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        "Loading..."
                                    ) : (
                                        <>
                                            <Lock className="mr-2 h-4 w-4" />
                                            Login
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleBranchSelect}>
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="branch">Branch</Label>
                                    <Select
                                        value={selectedBranch}
                                        onValueChange={setSelectedBranch}
                                        required
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredBranches.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    <div className="flex items-center gap-2">
                                                        <GitBranch className="h-4 w-4" />
                                                        {branch.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading || !selectedBranch}>
                                    {isLoading ? (
                                        "Loading..."
                                    ) : (
                                        "Continue"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}