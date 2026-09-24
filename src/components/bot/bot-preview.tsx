"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Character } from "./character";
import { previewActions } from "./behavior";

export function BotPreview() {
  const [action, setAction] = useState<(typeof previewActions)[number]>(
    previewActions[0],
  );
  const [size, setSize] = useState(192);
  const [replay, setReplay] = useState(0);
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-4xl px-[18px] py-8 sm:px-7"
    >
      <p className="font-mono text-xs text-muted-foreground">
        DEVELOPMENT PREVIEW
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Bot 动作预览</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        固定 blob 基本外形，排除眼型
        7、8。首页以平静为底，缓慢穿插开心、好奇、害羞、得意与俏皮五种完整表情；这里单独试播各状态。回答完成后带着彩带转一圈、轻跳一次，落地后散出彩色粒子。上传、口述等仅供素材预览，首页点击
        Bot 只会弹跳。首页连续 60 秒无操作会睡着，再次活动时醒来。
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_240px]">
        <div className="flex min-h-72 items-center justify-center rounded-xl border bg-card">
          <div style={{ width: size, height: size }}>
            <Character
              state={action[0]}
              activityKey={`${action[0]}:${replay}`}
              className="size-full"
            />
          </div>
        </div>
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">显示尺寸</legend>
            <div className="flex flex-wrap gap-2">
              {[192, 54, 43].map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={value === size ? "default" : "outline"}
                  aria-pressed={value === size}
                  onClick={() => setSize(value)}
                >
                  {value}px
                </Button>
              ))}
            </div>
          </fieldset>
          <Button
            variant="outline"
            onClick={() => setReplay((value) => value + 1)}
          >
            重播{action[1]}
          </Button>
          <p className="text-xs leading-6 text-muted-foreground">
            可使用页头切换明暗主题；系统减少动态效果偏好同样生效。
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {previewActions.map((item) => (
          <Button
            key={item[0]}
            variant={action[0] === item[0] ? "default" : "outline"}
            aria-pressed={action[0] === item[0]}
            onClick={() => setAction(item)}
          >
            {item[1]}
          </Button>
        ))}
      </div>
      <p className="mt-8 text-sm leading-6 text-muted-foreground">
        <Link href="/" className="text-foreground underline underline-offset-4">
          返回首页试播完整流程
        </Link>
        ：正常回答固定书写。也可停留在主题卡片上、切换主题、阅读后返回，检查各场景的反馈。
      </p>
    </main>
  );
}
