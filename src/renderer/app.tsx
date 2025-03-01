import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Editor, EditorRefType } from './components/Editor/Editor';
import { FileTree } from './components/FileTree/FileTree';
import { GitControls } from './components/GitOps/GitControls';
import { useState, useRef } from 'react';
import { Save, Settings } from 'lucide-react';
import { AppSettings } from './components/AppSettings/AppSettings';

const root = createRoot(document.body);
root.render(<App />);


export default function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const editorRef = useRef<EditorRefType>(null);

  // ファイルが選択されたときの処理
  const handleFileSelect = async (filePath: string) => {
    try {
      setSelectedFile(filePath);
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      const content = await window.api.fs.readFile(filePath);
      setFileContent(content);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  // ファイルを保存する処理
  const handleSave = async () => {
    if (selectedFile) {
      try {
        // エディターからマークダウンテキストを取得
        let contentToSave = fileContent;
        if (editorRef.current) {
          contentToSave = editorRef.current.getMarkdown();
        }
        console.log('contentToSave', contentToSave);

        // @ts-ignore - APIはプリロードスクリプトで定義されている
        await window.api.fs.writeFile(selectedFile, contentToSave);
        console.log('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-8 pb-2">
      <header className="mb-8 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">CommitNotes</h1>
        <button
          className="rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={() => {
            setIsSettingsOpen(!isSettingsOpen);
          }}
        >
          <Settings className="w-6 h-6" />
        </button>
      </header>
      <main className="px-8 flex gap-6">
        {isSettingsOpen ? (
          <AppSettings />
        ) : (
          <>
            <div className="w-1/4">
              <GitControls selectedFile={selectedFile} />
              <FileTree onFileSelect={handleFileSelect} />
            </div>
            <div className="w-3/4">
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">
                    {selectedFile ? selectedFile.split('/').pop() : 'ファイルを選択してください'}
                  </h2>
                  <button
                    onClick={handleSave}
                    disabled={!selectedFile}
                    className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>

                {fileContent && (
                  <Editor
                    initialContent={fileContent}
                    ref={editorRef}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
