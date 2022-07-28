
import Skeleton from "react-loading-skeleton";
import Badge from "src/Components/Badge/Badge";
import HeaderSkeleton from "src/features/Posts/Components/PostCard/Header/Header.Skeleton";



export default function PageContentSkeleton() {
    return <div id="content" className="bg-white md:p-32 md:border-2 border-gray-200 rounded-16 relative">
        <div className="flex flex-col gap-24 relative">
            <h1 className="text-[42px] leading-[58px] font-bolder">
                <Skeleton width={'min(80%,16ch)'} />
            </h1>
            <HeaderSkeleton />
            <div className="flex flex-wrap gap-8">
                {Array(3).fill(0).map(i => <Badge key={i} size='sm'>
                    <div className="opacity-0">hidden</div>
                </Badge>)}
            </div>
        </div>

        <div className={`mt-42 text-body4`}>
            <Skeleton width={'100%'} />
            <Skeleton width={'90%'} />
            <Skeleton width={'92%'} />
            <Skeleton width={'70%'} />
            <div className="mt-32"></div>
            <Skeleton width={'100%'} />
            <Skeleton width={'92%'} />
            <Skeleton width={'95%'} />
            <Skeleton width={'40%'} />
        </div>
    </div>

}