"use client";

import { FileQuestion } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <FileQuestion className="h-16 w-16 text-gray-400" />
          </div>
          <CardTitle className="text-2xl">Work in Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            This section is currently under development. Please check back later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
