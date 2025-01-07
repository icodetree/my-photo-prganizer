"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  // 상태 관리를 위한 useState 훅 정의
  const [folderPath, setFolderPath] = useState(""); // 선택된 폴더 경로
  const [message, setMessage] = useState(""); // 결과 메시지
  const [organizationType, setOrganizationType] = useState("date"); // 정렬 옵션
  const [options, setOptions] = useState([]); // 정렬 옵션 목록
  const [includeSubfolders, setIncludeSubfolders] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  // 컴포넌트 마운트 시 정렬 옵션 목록 가져오기
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const optionList = await window.electronAPI.getOrganizationOptions();
        setOptions(optionList);
      } catch (error) {
        console.error("Error loading options:", error);
      }
    };
    loadOptions();
  }, []);

  // 폴더 선택 핸들러
  const handleSelectFolder = async () => {
    try {
      const path = await window.electronAPI.selectFolder();
      if (path) {
        setFolderPath(path);
        setResult(null); // 새 폴더 선택 시 이전 결과 초기화
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
      setMessage("폴더 선택 중 오류가 발생했습니다.");
    }
  };

  // 파일 정리 시작 핸들러
  const handleOrganize = async () => {
    if (!folderPath) {
      setMessage("폴더를 먼저 선택하세요.");
      return;
    }

    setProcessing(true);
    setMessage("사진 정리 중...");
    setResult(null);

    try {
      const result = await window.electronAPI.organizePhotos(
        folderPath,
        organizationType,
        includeSubfolders
      );

      setResult(result);
      if (result.success) {
        setMessage(
          `${result.organized?.length || 0}개의 파일이 정리되었습니다.`
        );
      } else {
        setMessage("오류가 발생했습니다: " + result.error);
      }
    } catch (error) {
      console.error("Error organizing photos:", error);
      setMessage("파일 정리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-full">
      <Card>
        <CardHeader>
          <CardTitle>갤러리 정리</CardTitle>
          <CardDescription>
            선택한 방식으로 사진을 자동으로 정리해드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <Button onClick={handleSelectFolder} variant="outline">
              <FolderOpen className="mr-2 h-4 w-4" />
              폴더 선택
            </Button>

            <Select
              value={organizationType}
              onValueChange={setOrganizationType}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="정렬 방식 선택" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 하위폴더 */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="subfolders"
                checked={includeSubfolders}
                onCheckedChange={setIncludeSubfolders}
              />
              <label
                htmlFor="subfolders"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                하위 폴더 포함
              </label>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>선택된 폴더 : {folderPath}</AlertDescription>
          </Alert>

          <Button onClick={handleOrganize} disabled={!folderPath || processing}>
            <ScanLine className="mr-2 h-4 w-4" />
            {processing ? "정리 중..." : "정리 시작"}
          </Button>

          {message && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex align-middle">
                결과확인 : {message}
              </AlertDescription>
            </Alert>
          )}

          {result && result.success && (
            <div className="space-y-2">
              <div className="text-sm">
                <p>✓ 처리된 파일 : {result.processedCount}개</p>
                {result.skippedCount > 0 && (
                  <p>- 건너뛴 파일 : {result.skippedCount}개</p>
                )}
              </div>

              {result.errors && result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    처리 중 {result.errors.length}개의 오류가 발생했습니다.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
