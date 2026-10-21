import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-teal-400/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-9 h-9 text-teal-400" />
        </div>
        <h1 className="font-display text-2xl font-bold">Thanks for your purchase!</h1>
        <p className="text-sm text-muted-foreground">
          Your payment was received. Your credits or subscription will be applied to your account shortly.
        </p>
        <Link to="/pricing">
          <Button className="rounded-xl" style={{ background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", color: "#0a1628" }}>
            Back to plans
          </Button>
        </Link>
      </div>
    </div>
  );
}
