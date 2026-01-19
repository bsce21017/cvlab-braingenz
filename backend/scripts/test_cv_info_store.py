"""
Test script for cv_info_store table
Run from backend directory: python -m scripts.test_cv_info_store
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.cv_info_store import CVInfoStore, MetadataStatus


def test_cv_info_store():
    """Test CRUD operations on cv_info_store table"""
    db = SessionLocal()

    try:
        print("=" * 50)
        print("Testing cv_info_store table")
        print("=" * 50)

        # 1. CREATE - Insert a test record
        print("\n1. Creating test record...")
        test_record = CVInfoStore(
            text_s3_file_path="test/optimized/cv_123.txt",
            pdf_s3_file_path="test/optimized/cv_123.pdf",
            metadata_status=MetadataStatus.PENDING
        )
        db.add(test_record)
        db.commit()
        db.refresh(test_record)
        print(f"   Created record with id: {test_record.id}")
        print(f"   date_added: {test_record.date_added}")

        # 2. READ - Fetch the record back
        print("\n2. Reading record back...")
        fetched = db.query(CVInfoStore).filter(CVInfoStore.id == test_record.id).first()
        print(f"   id: {fetched.id}")
        print(f"   text_s3_file_path: {fetched.text_s3_file_path}")
        print(f"   pdf_s3_file_path: {fetched.pdf_s3_file_path}")
        print(f"   date_added: {fetched.date_added}")
        print(f"   metadata_status: {fetched.metadata_status}")

        # 3. UPDATE - Update the record
        print("\n3. Updating record...")
        fetched.metadata_status = MetadataStatus.DONE
        fetched.metadata_model = "gpt-4o"
        db.commit()
        db.refresh(fetched)
        print(f"   metadata_status updated to: {fetched.metadata_status}")
        print(f"   metadata_model updated to: {fetched.metadata_model}")

        # 4. DELETE - Clean up test record
        print("\n4. Deleting test record...")
        db.delete(fetched)
        db.commit()
        print(f"   Record deleted successfully")

        # 5. Verify deletion
        print("\n5. Verifying deletion...")
        check = db.query(CVInfoStore).filter(CVInfoStore.id == test_record.id).first()
        if check is None:
            print("   Record confirmed deleted")
        else:
            print("   WARNING: Record still exists!")

        print("\n" + "=" * 50)
        print("All tests passed! cv_info_store is working correctly.")
        print("=" * 50)

    except Exception as e:
        print(f"\nERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    test_cv_info_store()
