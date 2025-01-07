"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, FolderOpen, ScanLine } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [folderPath, setFolderPath] = useState("");
  const [message, setMessage] = useState("");

  const handleSelectFolder = async () => {
    try {
      const path = await window.electronAPI.selectFolder();
      setFolderPath(path);
    } catch (error) {
      console.error("Error selecting folder:", error);
    }
  };

  const handleOrganize = async () => {
    if (!folderPath) {
      setMessage("폴더를 먼저 선택하세요.");
      return;
    }
    setMessage("사진 정리 중...");
    try {
      const result = await window.electronAPI.organizePhotos(folderPath);
      if (result.success) {
        setMessage("사진 정리가 완료되었습니다.");
      } else {
        setMessage("오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Error organizing photos:", error);
      setMessage("오류가 발생했습니다.");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-full">
      <Card>
        <CardHeader>
          <CardTitle>갤러리 정리</CardTitle>
          <CardDescription>
            날짜별로 사진을 자동으로 정리해드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleSelectFolder} variant="outline">
              <FolderOpen className="mr-2 h-4 w-4" />
              폴더 선택
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>선택된 폴더: {folderPath}</AlertDescription>
          </Alert>

          <Button onClick={handleOrganize}>
            <ScanLine className="mr-2 h-4 w-4" />
            정리 시작
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex align-middle">
              결과확인 : {message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
