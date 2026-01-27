import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Clock,
  FileText,
  PenTool,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui';
import { formatRelativeTime, formatWordCount } from '@/lib/utils';
import type { BookWithProgress } from '@/lib/types';

async function getBooks(userId: string): Promise<BookWithProgress[]> {
  const supabase = await createClient();

  // Get all books for the user
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !books) {
    console.error('Error fetching books:', error);
    return [];
  }

  // For each book, calculate progress
  const booksWithProgress: BookWithProgress[] = await Promise.all(
    books.map(async (book) => {
      // Get structure nodes
      const { data: nodes } = await supabase
        .from('structure_nodes')
        .select('id')
        .eq('book_id', book.id);

      const nodeIds = nodes?.map((n) => n.id) || [];
      const nodeCount = nodeIds.length;

      // Get outlines count
      const { count: outlineCount } = await supabase
        .from('outlines')
        .select('*', { count: 'exact', head: true })
        .in('node_id', nodeIds.length > 0 ? nodeIds : ['none']);

      // Get drafts with word counts
      const { data: drafts } = await supabase
        .from('drafts')
        .select('word_count')
        .in('node_id', nodeIds.length > 0 ? nodeIds : ['none']);

      const draftCount = drafts?.filter((d) => d.word_count > 0).length || 0;
      const totalWordCount = drafts?.reduce((sum, d) => sum + (d.word_count || 0), 0) || 0;

      return {
        ...book,
        total_word_count: totalWordCount,
        outlined_percentage: nodeCount > 0 ? Math.round(((outlineCount || 0) / nodeCount) * 100) : 0,
        drafted_percentage: nodeCount > 0 ? Math.round((draftCount / nodeCount) * 100) : 0,
        node_count: nodeCount,
      };
    })
  );

  return booksWithProgress;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const books = await getBooks(user.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span className="font-mono text-sm uppercase tracking-wider">Book Builder</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user.email}</span>
            </div>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My Books</h1>
            <p className="text-muted-foreground mt-1">
              {books.length === 0
                ? 'Create your first book to get started'
                : `${books.length} book${books.length === 1 ? '' : 's'} in your library`
              }
            </p>
          </div>
          <Link href="/books/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Book
            </Button>
          </Link>
        </div>

        {/* Books grid */}
        {books.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book, index) => (
              <BookCard key={book.id} book={book} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24 animate-scale-in">
      <div className="inline-flex items-center justify-center w-20 h-20 border border-border mb-6">
        <BookOpen className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No books yet</h2>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
        Start your writing journey by creating your first book. We&apos;ll help you structure and write it.
      </p>
      <Link href="/books/new">
        <Button size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Book
        </Button>
      </Link>
    </div>
  );
}

function BookCard({ book, index }: { book: BookWithProgress; index: number }) {
  return (
    <Link href={`/books/${book.id}/structure`}>
      <div
        className="group bg-card border border-border p-6 transition-all duration-300 hover:border-primary hover:shadow-[0_0_20px_var(--amber-glow)] animate-slide-up cursor-pointer"
        style={{ '--stagger': `${index * 50}ms` } as React.CSSProperties}
      >
        {/* Book title and genre */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {book.is_fiction ? 'Fiction' : 'Nonfiction'}
            {book.genre && ` · ${book.genre}`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-wider">Outlined</span>
            </div>
            <div className="font-mono text-lg">{book.outlined_percentage}%</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <PenTool className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-wider">Drafted</span>
            </div>
            <div className="font-mono text-lg">{book.drafted_percentage}%</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-wider">Words</span>
            </div>
            <div className="font-mono text-lg">{formatWordCount(book.total_word_count)}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-secondary mb-4">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${book.drafted_percentage}%` }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRelativeTime(book.updated_at)}</span>
          </div>
          <span className="font-mono opacity-0 group-hover:opacity-100 transition-opacity text-primary">
            CONTINUE →
          </span>
        </div>
      </div>
    </Link>
  );
}
