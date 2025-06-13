import { LoginForm } from "@/components/LoginForm";
import { GalleryVerticalEnd } from "lucide-react";

const Login = () => {
  return (
    <div className="bg-muted flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2 font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <span>Chico Softwares</span>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
