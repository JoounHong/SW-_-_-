import os
import json
from datetime import datetime

# 데이터 파일 경로
DATA_FILE = "assignments.json"

# 진행 상태 상수
STATUS_TODO = "시작 전"
STATUS_DOING = "진행 중"
STATUS_DONE = "완료"

def load_assignments():
    """파일에서 과제 데이터를 로드합니다."""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ 데이터를 불러오는 중 오류가 발생했습니다: {e}")
            return []
    return []

def save_assignments(assignments):
    """과제 데이터를 파일에 저장합니다."""
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(assignments, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"⚠️ 데이터를 저장하는 중 오류가 발생했습니다: {e}")

def get_d_day(due_date_str):
    """마감일을 기준으로 D-Day를 계산합니다."""
    try:
        due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
        today = datetime.today().date()
        delta = (due_date - today).days
        if delta == 0:
            return "D-Day"
        elif delta > 0:
            return f"D-{delta}"
        else:
            return f"D+{abs(delta)} (마감 경과)"
    except ValueError:
        return "N/A"

def validate_date(date_text):
    """날짜 형식이 YYYY-MM-DD 인지 확인합니다."""
    try:
        datetime.strptime(date_text, "%Y-%m-%d")
        return True
    except ValueError:
        return False

def show_banner(title):
    """눈에 띄는 대시보드 배너를 출력합니다."""
    print("\n" + "=" * 50)
    print(f" {title:^46}")
    print("=" * 50)

def register_assignment(assignments):
    """과제를 새롭게 등록합니다."""
    show_banner("과제 등록")
    
    subject = input("과목명을 입력하세요: ").strip()
    if not subject:
        print("❌ 과목명은 필수 입력 항목입니다.")
        return
        
    title = input("과제명을 입력하세요: ").strip()
    if not title:
        print("❌ 과제명은 필수 입력 항목입니다.")
        return

    while True:
        due_date = input("마감일을 입력하세요 (YYYY-MM-DD): ").strip()
        if validate_date(due_date):
            break
        print("❌ 올바른 날짜 형식(YYYY-MM-DD)으로 입력해주세요. (예: 2026-06-30)")

    # 과제 딕셔너리 생성
    new_assignment = {
        "id": int(datetime.now().timestamp() * 1000),  # 고유 ID 생성
        "subject": subject,
        "title": title,
        "due_date": due_date,
        "status": STATUS_TODO
    }
    
    assignments.append(new_assignment)
    save_assignments(assignments)
    print(f"\n✅ 과제 '{title}'가 정상적으로 등록되었습니다.")

def print_assignment_list(list_to_show):
    """전달된 과제 목록을 테이블 형식으로 출력합니다."""
    if not list_to_show:
        print("\n등록된 과제가 없습니다.")
        return

    print(f"\n{'번호':<4} | {'과목명':<12} | {'과제명':<20} | {'마감일 (D-Day)':<18} | {'진행 상태':<8}")
    print("-" * 75)
    for idx, item in enumerate(list_to_show, 1):
        d_day = get_d_day(item["due_date"])
        due_info = f"{item['due_date']} ({d_day})"
        
        # 상태별 가시성 확보를 위한 텍스트 포맷팅
        status = item["status"]
        if status == STATUS_DONE:
            status_display = f"🟢 {status}"
        elif status == STATUS_DOING:
            status_display = f"🔵 {status}"
        else:
            status_display = f"⚪ {status}"

        # 한글 정렬 지원을 위한 포맷 설정 (보정)
        print(f"{idx:<4} | {item['subject']:<12} | {item['title']:<20} | {due_info:<18} | {status_display:<8}")
    print("-" * 75)

def view_assignments(assignments):
    """전체 과제를 마감일 순서로 정렬하여 조회합니다."""
    show_banner("과제 전체 조회")
    # 마감일 기준으로 오름차순 정렬하여 보여줌 (기본 정렬 기능 추가로 편의성 증대)
    sorted_assignments = sorted(assignments, key=lambda x: x["due_date"])
    print_assignment_list(sorted_assignments)

def search_assignments(assignments):
    """과목명 혹은 과제명으로 과제를 검색합니다."""
    show_banner("과제 검색")
    query = input("검색할 과목명 또는 과제명을 입력하세요: ").strip().lower()
    
    if not query:
        print("❌ 검색어를 입력해주세요.")
        return

    results = []
    for item in assignments:
        if query in item["subject"].lower() or query in item["title"].lower():
            results.append(item)

    print(f"\n🔍 '{query}' 검색 결과: 총 {len(results)}건")
    print_assignment_list(results)

def select_assignment_by_index(assignments, action_name):
    """인덱스 번호 입력을 받아 원본 목록에서의 실제 과제 객체를 반환합니다."""
    # 마감일 순으로 동일하게 보여주고 선택하게 함
    sorted_assignments = sorted(assignments, key=lambda x: x["due_date"])
    print_assignment_list(sorted_assignments)
    
    if not sorted_assignments:
        return None

    try:
        choice = int(input(f"\n{action_name}할 과제의 번호를 선택하세요 (취소하려면 0 입력): "))
        if choice == 0:
            print("취소되었습니다.")
            return None
        if 1 <= choice <= len(sorted_assignments):
            selected = sorted_assignments[choice - 1]
            # 원본 assignments 배열에서 ID가 일치하는 실제 인덱스 찾기
            for idx, item in enumerate(assignments):
                if item["id"] == selected["id"]:
                    return idx
        print("❌ 잘못된 번호입니다.")
    except ValueError:
        print("❌ 숫자만 입력 가능합니다.")
    return None

def modify_assignment(assignments):
    """등록된 과제 정보를 수정합니다."""
    show_banner("과제 정보 수정")
    idx = select_assignment_by_index(assignments, "수정")
    
    if idx is None:
        return
        
    item = assignments[idx]
    print(f"\n👉 선택된 과제: [{item['subject']}] {item['title']} (마감: {item['due_date']})")
    print("(엔터를 치고 넘어가면 기존 정보가 유지됩니다.)")
    
    new_subject = input(f"새로운 과목명 [{item['subject']}]: ").strip()
    if new_subject:
        item["subject"] = new_subject
        
    new_title = input(f"새로운 과제명 [{item['title']}]: ").strip()
    if new_title:
        item["title"] = new_title

    while True:
        new_due_date = input(f"새로운 마감일 [{item['due_date']}] (YYYY-MM-DD): ").strip()
        if not new_due_date:
            break
        if validate_date(new_due_date):
            item["due_date"] = new_due_date
            break
        print("❌ 올바른 날짜 형식(YYYY-MM-DD)으로 입력해주세요.")

    save_assignments(assignments)
    print("\n✅ 과제 정보가 정상적으로 수정되었습니다.")

def delete_assignment(assignments):
    """등록된 과제를 삭제합니다."""
    show_banner("과제 삭제")
    idx = select_assignment_by_index(assignments, "삭제")
    
    if idx is None:
        return
        
    item = assignments[idx]
    confirm = input(f"⚠️ 정말로 [{item['subject']}] '{item['title']}' 과제를 삭제하시겠습니까? (y/n): ").strip().lower()
    if confirm == 'y':
        deleted_title = assignments.pop(idx)["title"]
        save_assignments(assignments)
        print(f"\n✅ 과제 '{deleted_title}'가 성공적으로 삭제되었습니다.")
    else:
        print("\n삭제가 취소되었습니다.")

def change_status(assignments):
    """과제의 진행 상태를 변경합니다."""
    show_banner("진행 상태 변경")
    idx = select_assignment_by_index(assignments, "상태를 변경")
    
    if idx is None:
        return
        
    item = assignments[idx]
    print(f"\n👉 현재 과제 상태: {item['status']}")
    print("1. 시작 전  |  2. 진행 중  |  3. 완료")
    
    choice = input("새로운 상태의 번호를 선택하세요 (1~3): ").strip()
    if choice == '1':
        item["status"] = STATUS_TODO
    elif choice == '2':
        item["status"] = STATUS_DOING
    elif choice == '3':
        item["status"] = STATUS_DONE
    else:
        print("❌ 잘못된 선택입니다. 상태가 변경되지 않았습니다.")
        return

    save_assignments(assignments)
    print(f"\n✅ 과제 상태가 '{item['status']}'(으)로 변경되었습니다.")

def check_statistics(assignments):
    """과제 진행 관련 통계를 제공합니다."""
    show_banner("과제 통계 요약")
    
    total = len(assignments)
    if total == 0:
        print("\n등록된 과제가 없어 통계를 제공할 수 없습니다.")
        return

    todo = sum(1 for item in assignments if item["status"] == STATUS_TODO)
    doing = sum(1 for item in assignments if item["status"] == STATUS_DOING)
    done = sum(1 for item in assignments if item["status"] == STATUS_DONE)
    
    completion_rate = (done / total) * 100
    
    print(f"📊 전체 등록된 과제 수: {total}개")
    print(f"⚪ 시작 전 과제 수: {todo}개")
    print(f"🔵 진행 중 과제 수: {doing}개")
    print(f"🟢 완료된 과제 수: {done}개")
    print(f"📈 과제 완료율: {completion_rate:.1f}%")
    print("-" * 50)
    
    # 마감일 경과 여부 체크
    today = datetime.today().date()
    overdue_count = 0
    for item in assignments:
        if item["status"] != STATUS_DONE:
            try:
                due = datetime.strptime(item["due_date"], "%Y-%m-%d").date()
                if due < today:
                    overdue_count += 1
            except ValueError:
                pass
                
    if overdue_count > 0:
        print(f"🚨 경고: 마감일이 지났으나 완료되지 않은 과제가 {overdue_count}개 있습니다!")
        print("   서둘러 과제를 완료해주세요!")

def main():
    assignments = load_assignments()
    
    while True:
        show_banner("개인 과제 관리 프로그램 (학업 일정 매니저)")
        print(" 1. 과제 등록")
        print(" 2. 과제 전체 조회")
        print(" 3. 과제 검색")
        print(" 4. 과제 정보 수정")
        print(" 5. 과제 삭제")
        print(" 6. 진행 상태 변경")
        print(" 7. 통계 확인")
        print(" 8. 프로그램 종료")
        print("=" * 50)
        
        choice = input("원하는 메뉴 번호를 입력하세요: ").strip()
        
        if choice == '1':
            register_assignment(assignments)
        elif choice == '2':
            view_assignments(assignments)
        elif choice == '3':
            search_assignments(assignments)
        elif choice == '4':
            modify_assignment(assignments)
        elif choice == '5':
            delete_assignment(assignments)
        elif choice == '6':
            change_status(assignments)
        elif choice == '7':
            check_statistics(assignments)
        elif choice == '8':
            print("\n👋 프로그램을 종료합니다. 수고하셨습니다!")
            break
        else:
            print("\n❌ 잘못된 번호입니다. 1번부터 8번 사이의 숫자를 입력해주세요.")
            
        input("\n계속하려면 엔터를 누르세요...")

if __name__ == "__main__":
    main()
