"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Home = () => {
  return (
    <main>
      <h1>Hello To NCS</h1>
      <ThemeToggle />
      <Button>
        <Link href="/auth/login">Login</Link>
      </Button>
    </main>
  );
};

export default Home;
