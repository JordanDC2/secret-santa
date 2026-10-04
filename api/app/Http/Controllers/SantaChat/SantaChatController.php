<?php

namespace App\Http\Controllers\SantaChat;

use App\Actions\SantaChat\SendSantaMessage;
use App\Events\SantaChatChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\SantaChat\SendMessageRequest;
use App\Models\Group;
use App\Models\SantaMessage;
use App\Models\SecretSantaAssignment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The two anonymous threads each member has in a drawn group, named from their side:
 * "my-person" (they're the Santa) and "my-santa" (they're someone's person). Only the
 * current draw's threads are reachable; earlier draws' stay in the database as history.
 * Nobody else can open a thread, not even the group's owner.
 */
class SantaChatController extends Controller
{
    public function show(Request $request, Group $group, string $side): JsonResponse
    {
        [$assignment, $isSanta] = $this->thread($request->user(), $group, $side);

        $messages = $assignment->messages()->oldest('id')->get()->map(fn (SantaMessage $message) => [
            'id' => $message->id,
            'mine' => $message->from_santa === $isSanta,
            'body' => $message->body,
            'sent_at' => $message->created_at?->toIso8601String(),
        ]);

        return response()->json([
            // Only the Santa learns who's on the other end.
            'with' => $isSanta ? ['id' => $assignment->receiver->id, 'name' => $assignment->receiver->name] : null,
            'messages' => $messages,
        ]);
    }

    public function store(SendSantaMessage $action, SendMessageRequest $request, Group $group, string $side): Response
    {
        [$assignment, $isSanta] = $this->thread($request->user(), $group, $side);

        $action($assignment, $isSanta, $request->string('body')->value());

        return response()->noContent();
    }

    /**
     * Marks the other side's messages read, which also lets their next one email again.
     */
    public function read(Request $request, Group $group, string $side): Response
    {
        [$assignment, $isSanta] = $this->thread($request->user(), $group, $side);

        $marked = $assignment->messages()->where('from_santa', ! $isSanta)->whereNull('read_at')->update(['read_at' => now()]);

        if ($marked > 0) {
            SantaChatChanged::dispatch($request->user()->id, $group->id);
        }

        return response()->noContent();
    }

    /**
     * @return array{SecretSantaAssignment, bool} The assignment and whether the user is its Santa.
     */
    private function thread(User $user, Group $group, string $side): array
    {
        $this->authorize('view', $group);

        $isSanta = $side === 'my-person';
        $assignment = $isSanta ? $group->assignmentFor($user) : $group->assignmentOfSantaFor($user);

        abort_if($assignment === null, 404, $isSanta ? "You haven't drawn anyone in this group yet." : "You don't have a Secret Santa in this group yet.");

        return [$assignment, $isSanta];
    }
}
