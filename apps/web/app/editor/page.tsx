import { Suspense } from "react";
import EditorPage  from "../components/editor/editor-page";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Editor...</div>}>
      <EditorPage />
    </Suspense>
  );
}