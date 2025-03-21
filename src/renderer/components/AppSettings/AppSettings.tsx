import { useState, useEffect } from 'react';
import { AppSettings as AppSettingsType } from '../../../types/appSettings';
import { CheckIcon } from 'lucide-react';

export const AppSettings = ({ onSettingsChange }: { onSettingsChange: () => void }) => {
  const [settings, setSettings] = useState<AppSettingsType>({
    rootDirectory: {
      path: '',
    },
    git: {
      remoteUrl: '',
      token: '',
      author: {
        name: '',
        email: '',
      },
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 設定を読み込む
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await window.api.app.getSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
      }
    };

    loadSettings();
  }, []);

  // 設定を保存する
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await window.api.app.setSettings(settings);
      setSaveMessage({ type: 'success', text: '設定を保存しました' });
      onSettingsChange();
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      setSaveMessage({ type: 'error', text: '設定の保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  // ディレクトリ選択ダイアログを開く
  const handleSelectDirectory = async () => {
    try {
      const dirPath = await window.api.dialog.selectDirectory();
      if (dirPath) {
        setSettings((prev: AppSettingsType) => ({
          ...prev,
          rootDirectory: { ...prev.rootDirectory, path: dirPath },
        }));
      }
    } catch (error) {
      console.error('ディレクトリ選択に失敗しました:', error);
    }
  };

  return (
    <div className="w-full rounded-lg bg-white p-6 shadow">
      <h2 className="mb-6 text-xl font-bold">アプリケーション設定</h2>

      <div className="space-y-6">
        {/* ルートディレクトリ設定 */}
        <div>
          <h3 className="mb-3 text-lg font-medium">ルートディレクトリ設定</h3>
          <div className="flex gap-2">
            <div className="relative flex-1 items-center">
              <input
                type="text"
                disabled
                value={settings.rootDirectory.path}
                placeholder="ルートディレクトリのパス"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              {settings.rootDirectory.path && (
                <CheckIcon className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-green-500" />
              )}
            </div>
            <button
              onClick={handleSelectDirectory}
              className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
            >
              ディレクトリを選択
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            メモを保存している<code className="font-bold text-blue-500">.git</code>
            があるディレクトリを指定してください
          </p>
        </div>

        {/* Git設定 */}
        <div>
          <h3 className="mb-3 text-lg font-medium">Git設定</h3>

          <div className="mb-4">
            <label htmlFor="remoteUrl" className="mb-1 block text-sm font-medium text-gray-700">
              リモートURL
            </label>
            <input
              id="remoteUrl"
              type="text"
              value={settings.git.remoteUrl}
              onChange={(e) =>
                setSettings((prev: AppSettingsType) => ({
                  ...prev,
                  git: { ...prev.git, remoteUrl: e.target.value },
                }))
              }
              placeholder="https://github.com/username/repo.git"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="token" className="mb-1 block text-sm font-medium text-gray-700">
              アクセストークン
            </label>
            <input
              id="token"
              type="password"
              value={settings.git.token}
              onChange={(e) =>
                setSettings((prev: AppSettingsType) => ({
                  ...prev,
                  git: { ...prev.git, token: e.target.value },
                }))
              }
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-sm text-gray-500">
              GitHubのパーソナルアクセストークンを入力してください
            </p>
          </div>

          <div className="mt-4">
            <h4 className="text-md mb-3 font-medium">コミットの作成者情報</h4>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="authorName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  作者名
                </label>
                <input
                  id="authorName"
                  type="text"
                  value={settings.git.author.name}
                  onChange={(e) =>
                    setSettings((prev: AppSettingsType) => ({
                      ...prev,
                      git: {
                        ...prev.git,
                        author: { ...prev.git.author, name: e.target.value },
                      },
                    }))
                  }
                  placeholder="Your Name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="authorEmail"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  メールアドレス
                </label>
                <input
                  id="authorEmail"
                  type="email"
                  value={settings.git.author.email}
                  onChange={(e) =>
                    setSettings((prev: AppSettingsType) => ({
                      ...prev,
                      git: {
                        ...prev.git,
                        author: { ...prev.git.author, email: e.target.value },
                      },
                    }))
                  }
                  placeholder="your.email@example.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '設定を保存'}
          </button>

          {saveMessage && (
            <p
              className={`mt-2 text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
            >
              {saveMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
