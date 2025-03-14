import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Editor, EditorRefType } from './components/Editor/Editor';
import { FileTree } from './components/FileTree/FileTree';
import { GitControls } from './components/GitOps/GitControls';
import { useState, useRef, useEffect } from 'react';
import { Save, Settings, Undo2 } from 'lucide-react';
import { AppSettings } from './components/AppSettings/AppSettings';

const root = createRoot(document.body);
root.render(<App />);

export default function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hasGitSettings, setHasGitSettings] = useState<boolean>(false);
  const editorRef = useRef<EditorRefType>(null);

  // Gitの設定を確認する関数
  const checkGitSettings = async () => {
    try {
      const settings = await window.api.app.getSettings();
      setHasGitSettings(!!settings?.rootDirectory?.path);
    } catch (error) {
      console.error('Error checking git settings:', error);
      setHasGitSettings(false);
    }
  };

  // Gitの設定を確認
  useEffect(() => {
    checkGitSettings();
  }, []);

  // ファイルが選択されたときの処理
  const handleFileSelect = async (filePath: string) => {
    try {
      setSelectedFile(filePath);
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

        await window.api.fs.writeFile(selectedFile, contentToSave);
        console.log('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  // 設定が変更されたときの処理
  const handleSettingsChange = () => {
    checkGitSettings();
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-8 pb-2">
      <header className="mb-4 flex justify-end px-8">
        <button
          className="cursor-pointer"
          onClick={() => setIsSettingsOpen((prevState) => !prevState)}
        >
          {isSettingsOpen ? <Undo2 className="h-6 w-6" /> : <Settings className="h-6 w-6" />}
        </button>
      </header>
      <main className="flex h-[calc(100vh-6rem)] gap-6 px-8">
        {isSettingsOpen ? (
          <AppSettings onSettingsChange={handleSettingsChange} />
        ) : (
          <>
            <div className="w-1/4">
              {hasGitSettings && <GitControls selectedFile={selectedFile} />}
              <FileTree
                onFileSelect={handleFileSelect}
                onSettingsClick={() => setIsSettingsOpen(true)}
              />
            </div>
            <div className="flex h-full w-3/4 flex-col">
              <div className="mb-1 flex flex-1 flex-col rounded-lg bg-white p-4 shadow">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">
                    {selectedFile ? selectedFile.split('/').pop() : 'ファイルを選択してください'}
                  </h2>
                  <button
                    onClick={handleSave}
                    disabled={!selectedFile}
                    className="flex cursor-pointer items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    保存
                  </button>
                </div>
                {fileContent && (
                  <Editor initialContent={fileContent} ref={editorRef} className="flex-1" />
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
