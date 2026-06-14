from .vector_store import find_similar_students

def get_similar_student_context(student):
    similar_students = find_similar_students(student)
    
    results = []
    
    for s in similar_students:
        results.append({
            "student_name": s.full_name,
            "educational_level": s.get_educational_level_display(),
        })
        
    return results
