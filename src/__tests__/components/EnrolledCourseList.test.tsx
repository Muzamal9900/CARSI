import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnrolledCourseList } from '@/components/lms/EnrolledCourseList';

const mockEnrollments = [
  {
    id: 'enr-1',
    course_id: 'crs-1',
    course_title: 'Water Damage Restoration Fundamentals',
    course_slug: 'wrt-water-damage-essentials',
    status: 'active',
    enrolled_at: '2026-03-01T10:00:00Z',
    completion_percentage: 40,
  },
  {
    id: 'enr-2',
    course_id: 'crs-2',
    course_title: 'Carpet and Rug Cleaning Techniques',
    course_slug: 'carpet-rug-cleaning-techniques',
    status: 'completed',
    enrolled_at: '2026-02-15T10:00:00Z',
    completion_percentage: 100,
  },
];

describe('EnrolledCourseList', () => {
  it('renders all enrolled courses', () => {
    render(<EnrolledCourseList enrollments={mockEnrollments} />);
    expect(screen.getByText('Water Damage Restoration Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Carpet and Rug Cleaning Techniques')).toBeInTheDocument();
  });

  it('renders one list item per course', () => {
    render(<EnrolledCourseList enrollments={mockEnrollments} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders nothing when there are no enrolments', () => {
    const { container } = render(<EnrolledCourseList enrollments={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('links each course to the learn URL for that course', () => {
    render(<EnrolledCourseList enrollments={mockEnrollments} />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute(
      'href',
      '/dashboard/learn/wrt-water-damage-essentials'
    );
  });

  it('shows the completed badge for finished courses', () => {
    render(<EnrolledCourseList enrollments={mockEnrollments} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows progress percentage for active courses', () => {
    render(<EnrolledCourseList enrollments={mockEnrollments} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
});
