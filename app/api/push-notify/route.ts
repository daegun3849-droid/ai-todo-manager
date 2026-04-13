import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/supabase/server";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

/**
 * 미완료 일정을 확인하고 알림을 보내는 Cron API
 * - 시작 30분 전 알림
 * - 종료 시간이 지났는데 미완료인 일정 알림
 */
export const GET = async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date();
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);

    // 30분 내 시작하는 미완료 일정 조회
    const { data: upcomingTodos } = await supabase
      .from("todos")
      .select("*, push_subscriptions!inner(subscription)")
      .eq("is_completed", false)
      .gte("start_at", now.toISOString())
      .lte("start_at", in30min.toISOString());

    // 종료 시간이 지났는데 미완료인 일정 조회
    const { data: overdueTodos } = await supabase
      .from("todos")
      .select("*, push_subscriptions!inner(subscription)")
      .eq("is_completed", false)
      .lt("end_at", now.toISOString());

    const notifications: Promise<void>[] = [];

    const sendPush = async (
      subscriptionStr: string,
      title: string,
      body: string,
      tag: string
    ) => {
      try {
        const subscription = JSON.parse(subscriptionStr) as webpush.PushSubscription;
        await webpush.sendNotification(
          subscription,
          JSON.stringify({ title, body, tag, url: "/" })
        );
      } catch (err) {
        console.error("푸시 전송 실패:", err);
      }
    };

    for (const todo of upcomingTodos ?? []) {
      const sub = (todo as Record<string, unknown> & { push_subscriptions?: { subscription: string } }).push_subscriptions?.subscription;
      if (!sub) continue;
      const startTime = new Date(todo.start_at as string).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      notifications.push(
        sendPush(
          sub,
          `⏰ 30분 후 일정: ${todo.title as string}`,
          `${startTime}에 시작합니다. 준비하세요!`,
          `upcoming-${todo.id as string}`
        )
      );
    }

    for (const todo of overdueTodos ?? []) {
      const sub = (todo as Record<string, unknown> & { push_subscriptions?: { subscription: string } }).push_subscriptions?.subscription;
      if (!sub) continue;
      notifications.push(
        sendPush(
          sub,
          `🔔 미완료 일정: ${todo.title as string}`,
          "일정 시간이 지났습니다. 완료 처리하거나 확인해 주세요.",
          `overdue-${todo.id as string}`
        )
      );
    }

    await Promise.all(notifications);

    return NextResponse.json({
      success: true,
      sent: notifications.length,
    });
  } catch (error) {
    console.error("알림 전송 중 오류:", error);
    return NextResponse.json({ error: "알림 전송 실패" }, { status: 500 });
  }
};
