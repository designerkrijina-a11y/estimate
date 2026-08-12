"use client"

import { useState, useTransition } from "react"
import { addAccount, deleteAccount, updateAccountRole } from "@/app/admin/accounts/actions"

export type AdminAccount = {
  login_id: string
  name: string | null
  role: "super_admin" | "admin" | "staff"
  created_at: string
}

const ROLE_LABEL: Record<AdminAccount["role"], string> = {
  super_admin: "수퍼관리자",
  admin: "관리자",
  staff: "담당자",
}

export function AccountsManager({
  accounts,
  currentLoginId,
}: {
  accounts: AdminAccount[]
  currentLoginId: string
}) {
  const [rows, setRows] = useState(accounts)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)

  function handleAdd(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addAccount(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setShowForm(false)
      window.location.reload()
    })
  }

  function handleRoleChange(loginId: string, role: string) {
    setError(null)
    setRows((prev) => prev.map((r) => (r.login_id === loginId ? { ...r, role: role as AdminAccount["role"] } : r)))
    startTransition(async () => {
      const result = await updateAccountRole(loginId, role)
      if (result?.error) {
        setError(result.error)
        window.location.reload()
      }
    })
  }

  function handleDelete(loginId: string) {
    if (
      !window.confirm(
        `${loginId} 항목을 목록에서 지울까요? (완전히 막히는 건 아니고, 다음에 다시 로그인하면 기본 관리자 등급으로 자동 등록됩니다.)`
      )
    )
      return
    setError(null)
    startTransition(async () => {
      const result = await deleteAccount(loginId)
      if (result?.error) {
        setError(result.error)
        return
      }
      setRows((prev) => prev.filter((r) => r.login_id !== loginId))
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {showForm ? "취소" : "+ 계정 접근 권한 추가"}
        </button>
      </div>

      {showForm && (
        <form
          action={handleAdd}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="email">
              현장관리 대시보드 이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-64 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              placeholder="name@ajd.co.kr"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="role">
              권한
            </label>
            <select
              id="role"
              name="role"
              defaultValue="admin"
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="staff">담당자</option>
              <option value="admin">관리자</option>
              <option value="super_admin">수퍼관리자</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "추가 중..." : "권한 추가"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">이메일</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">이름</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">권한</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">등록일</th>
              <th className="px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.login_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-3">{row.login_id}</td>
                <td className="whitespace-nowrap px-4 py-3">{row.name ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <select
                    value={row.role}
                    disabled={isPending || row.login_id === currentLoginId}
                    onChange={(e) => handleRoleChange(row.login_id, e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm disabled:opacity-50"
                  >
                    <option value="staff">담당자</option>
                    <option value="admin">관리자</option>
                    <option value="super_admin">수퍼관리자</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(row.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {row.login_id !== currentLoginId && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(row.login_id)}
                      className="rounded-md border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/5 disabled:opacity-50"
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        현장관리 대시보드 계정으로 로그인하면 첫 로그인 시 자동으로 {ROLE_LABEL.admin} 등급이 부여됩니다.
        {ROLE_LABEL.super_admin} 은 계정 관리 권한까지 갖고, {ROLE_LABEL.admin}/{ROLE_LABEL.staff} 는 견적 요청
        조회 권한만 갖습니다. 아이디/비밀번호는 현장관리 대시보드 계정을 그대로 쓰므로 여기서는 만들 수 없고,
        접근 등급만 관리합니다. 본인 계정의 권한은 변경하거나 목록에서 지울 수 없습니다.
      </p>
    </div>
  )
}
