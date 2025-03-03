import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, GitCommit, Upload, Download, Settings, Plus, RefreshCw, GitBranch } from 'lucide-react';
import { GitStatus, HeadStatus, StageStatus, StatusMatrix, WorkdirStatus } from '../../../types/gitStatus';

interface GitControlsProps {
  selectedFile: string | null;
}

// ファイル名から末尾のみを取得する関数
const getFileName = (path: string): string => {
  return path.split('/').pop() || path;
};

export const GitControls: React.FC<GitControlsProps> = ({ selectedFile }) => {
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Gitステータスを取得
  const fetchGitStatus = async () => {
    try {
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      const settings = await window.api.app.getSettings();
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      const statusMatrix: StatusMatrix = await window.api.git.status(settings.rootDirectory.path);

      // gitStatusに格納できる形に変換する
      const gitStatus: GitStatus = {
        staged: [],
        unstaged: [],
      };
      statusMatrix.forEach((status) => {
        const [filename, head, workTree, stage] = status;

        if (stage === StageStatus.ABSENT) {
          // [0,2,0]: "Untracked" - 新規ファイル（未追跡）
          if (workTree === WorkdirStatus.MODIFIED && head === HeadStatus.ABSENT) {
            gitStatus.unstaged.push({ filename, isDeleted: false });
          }
          // [1,0,0]: "Deleted (Staged)" - 削除（ステージング済み）
          if (workTree === WorkdirStatus.ABSENT && head === HeadStatus.PRESENT) {
            gitStatus.staged.push({ filename, isDeleted: true });
          }
        } else if (stage === StageStatus.IDENTICAL) {
          // [1,0,1]: "Deleted" - 削除（未ステージング）
          if (workTree === WorkdirStatus.ABSENT) {
            gitStatus.unstaged.push({ filename, isDeleted: true });
          }
          // [1,2,1]: "Modified" - 変更あり（未ステージング）
          if (workTree === WorkdirStatus.MODIFIED) {
            gitStatus.unstaged.push({ filename, isDeleted: false });
          }
        } else if (stage === StageStatus.MODIFIED) {
          // [1,2,2]: "Staged" - git add 済み
          // [0,2,2]: "Added" - git add 済み
          if (workTree === WorkdirStatus.MODIFIED) {
            gitStatus.staged.push({ filename, isDeleted: false });
          }
        } else if (stage === StageStatus.MODIFIED_AGAIN) {
          // [1,2,3]: "Staged & Modified" - git add 済み & さらに変更あり
          if (workTree === WorkdirStatus.MODIFIED) {
            gitStatus.unstaged.push({ filename, isDeleted: false });
            gitStatus.staged.push({ filename, isDeleted: false });
          }
        }
      });

      setGitStatus(gitStatus);
    } catch (error) {
      console.error('Error fetching git status:', error);
      setStatusMessage('Gitステータスの取得に失敗しました');
    }
  };

  // ファイルが選択されたときにGitステータスを更新()
  // パフォーマンスに影響がある場合キャッシュの使用や、ファイルを保存したときなどタイミングを考える
  useEffect(() => {
    fetchGitStatus();
  }, [selectedFile]);

  // 変更をコミットする処理
  const handleCommit = async () => {
    if (!selectedFile || !commitMessage) return;

    setIsLoading(true);
    try {
      // ファイルをステージング
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      await window.api.git.add(repoPath, selectedFile);

      // コミット
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      const sha = await window.api.git.commit(repoPath, commitMessage, {
        name: 'CommitNotes User',
        email: 'user@example.com'
      });

      setStatusMessage(`変更をコミットしました: ${sha.slice(0, 7)}`);
      setCommitMessage('');
      fetchGitStatus();
    } catch (error) {
      console.error('Error committing changes:', error);
      setStatusMessage('コミットに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 変更をプッシュする処理
  const handlePush = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    try {
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      await window.api.git.push(repoPath, remoteUrl, token);
      setStatusMessage('変更をGitHubにプッシュしました');
    } catch (error) {
      console.error('Error pushing changes:', error);
      setStatusMessage('プッシュに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 変更をプルする処理
  const handlePull = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    try {
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      await window.api.git.pull(repoPath, remoteUrl, token);
      setStatusMessage('GitHubから最新の変更を取得しました');
      fetchGitStatus();
    } catch (error) {
      console.error('Error pulling changes:', error);
      setStatusMessage('プルに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 設定の表示/非表示を切り替え
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // すべての変更をステージングする処理
  const handleStageAll = async () => {
    if (!gitStatus || gitStatus.unstaged.length === 0) return;

    try {
      setIsLoading(true);
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      const settings = await window.api.app.getSettings();
      const repoPath = settings.rootDirectory.path;

      // すべての未ステージングファイルをステージング
      for (const file of gitStatus.unstaged) {
        // @ts-ignore - APIはプリロードスクリプトで定義されている
        await window.api.git.add(repoPath, file.filename);
      }

      setStatusMessage(`すべての変更をステージングしました`);
      fetchGitStatus(); // ステータスを更新
    } catch (error) {
      console.error('Error staging all files:', error);
      setStatusMessage(`変更のステージングに失敗しました`);
    } finally {
      setIsLoading(false);
    }
  };

  // ステータスを再取得する処理
  const handleRefreshStatus = () => {
    fetchGitStatus();
    setStatusMessage('Gitステータスを更新しました');
  };

  // ファイルをステージングする処理
  const handleStageFile = async (filename: string) => {
    try {
      setIsLoading(true);
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      const settings = await window.api.app.getSettings();
      const repoPath = settings.rootDirectory.path;

      // @ts-ignore - APIはプリロードスクリプトで定義されている
      await window.api.git.add(repoPath, filename);

      setStatusMessage(`${getFileName(filename)} をステージングしました`);
      fetchGitStatus(); // ステータスを更新
    } catch (error) {
      console.error('Error staging file:', error);
      setStatusMessage(`${getFileName(filename)} のステージングに失敗しました`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div
        className="flex justify-between items-center cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-medium">Git操作</h3>
        <span className="text-gray-500">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      </div>

      {/* ファイル選択状態の表示 */}
      {isExpanded && (
        <div className="accordion-content">
          {/* ファイル選択状態の表示 */}
          {selectedFile ? (
            <div className="mb-4">
              <p className="text-sm text-gray-600">選択中: <span className="font-medium">{getFileName(selectedFile)}</span></p>
            </div>
          ) : (
            <div className="mb-4 text-gray-500 text-sm">
              ファイルを選択してください
            </div>
          )}

          {/* Git ステータスヘッダー */}
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Gitステータス</h4>
            <div className="flex space-x-2">
              <button
                onClick={handleRefreshStatus}
                className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-150 flex items-center text-xs"
                title="ステータスを更新"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              {gitStatus && gitStatus.unstaged.length > 0 && (
                <button
                  onClick={handleStageAll}
                  disabled={isLoading}
                  className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-150 flex items-center text-xs"
                  title="すべての変更をステージング"
                >
                  <GitBranch className="w-3 h-3 mr-1" />
                  すべてステージング
                </button>
              )}
            </div>
          </div>

          {/* Git ステータス */}
          {gitStatus && (
            <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
              {gitStatus.staged.length > 0 && (
                <div className="mb-2">
                  <p className="text-green-600 font-medium mb-1">ステージされている変更:</p>
                  <ul className="ml-2 space-y-1">
                    {gitStatus.staged.map(file => (
                      <li key={file.filename} className="text-green-600 truncate" title={file.filename}>
                        {getFileName(file.filename)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {gitStatus.unstaged.length > 0 && (
                <div className="mb-2">
                  <p className="text-yellow-600 font-medium mb-1">変更:</p>
                  <ul className="ml-2 space-y-1">
                    {gitStatus.unstaged.map(file => (
                      <li
                        key={file.filename}
                        className="group flex justify-between items-center py-1 px-1 hover:bg-gray-100 rounded transition-colors duration-150"
                      >
                        <span
                          className={`${file.isDeleted ? 'text-red-600' : 'text-yellow-600'} truncate max-w-[80%]`}
                          title={file.filename}
                        >
                          {getFileName(file.filename)}
                        </span>
                        <button
                          onClick={() => handleStageFile(file.filename)}
                          disabled={isLoading}
                          className="ml-2 p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-150 flex items-center text-xs opacity-0 group-hover:opacity-100"
                          title="ステージングする"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          ステージ
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {gitStatus.staged.length === 0 && gitStatus.unstaged.length === 0 && (
                <p className="text-gray-500 text-center py-2">変更はありません</p>
              )}
            </div>
          )}

          {/* コミットセクション */}
          <div className="mb-4">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="コミットメッセージを入力"
              disabled={isLoading || !selectedFile}
              className="w-full p-2 border border-gray-300 rounded mb-2 text-sm"
              rows={3}
            />
            <button
              onClick={handleCommit}
              disabled={isLoading || !selectedFile || !commitMessage}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <GitCommit className="w-4 h-4" />
              {isLoading ? '処理中...' : 'コミット'}
            </button>
          </div>

          {/* Git操作ボタン */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={handlePush}
              disabled={isLoading || !selectedFile}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              プッシュ
            </button>
            <button
              onClick={handlePull}
              disabled={isLoading || !selectedFile}
              className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              プル
            </button>
          </div>

          {/* ステータスメッセージ */}
          {statusMessage && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
              {statusMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};